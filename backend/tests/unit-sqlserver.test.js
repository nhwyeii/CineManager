// Kiểm tra lớp SQL Server bằng driver giả; không thay thế kiểm thử trên SQL Server thật.
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const mssqlPath = require.resolve('mssql');
const records = [], queue = [];
class Pool { async connect() { return this; } async close() {} }
class Transaction extends EventEmitter {
  async begin(level) { records.push({ begin: level, tx: this }); }
  async commit() { records.push({ commit: true, tx: this }); }
  async rollback() { records.push({ rollback: true, tx: this }); this.emit('rollback'); }
}
class Request {
  constructor(owner) { this.owner = owner; this.inputs = []; }
  input(...args) { this.inputs.push(args); return this; }
  async query(text) {
    records.push({ text, inputs: this.inputs, owner: this.owner });
    const result = queue.shift();
    if (result instanceof Error) throw result;
    return result || { recordset: [], rowsAffected: [1] };
  }
}
require.cache[mssqlPath] = { id: mssqlPath, filename: mssqlPath, loaded: true, exports: {
  ConnectionPool: Pool, Request, Transaction, BigInt: 'BIGINT', ISOLATION_LEVEL: { SERIALIZABLE: 'SERIALIZABLE' }
} };
require.cache[require.resolve('mssql/msnodesqlv8')] = { ...require.cache[mssqlPath], id: require.resolve('mssql/msnodesqlv8') };
const { db, transaction, parameterize } = require('../src/db');
test.beforeEach(() => { records.length = 0; queue.length = 0; });
test('SQL01: bind giá trị, giữ dấu hỏi nằm trong chuỗi SQL', async () => {
  const attack = "x'; DROP TABLE users; --";
  await db.prepare("SELECT '?' AS literal FROM users WHERE username = ?").all(attack);
  assert.equal(records[0].text, "SELECT '?' AS literal FROM users WHERE username = @cm_arg_0");
  assert.deepEqual(records[0].inputs, [['cm_arg_0', attack]]);
  assert.throws(() => parameterize('SELECT ?', []), /khớp/);
});
test('SQL02: lấy IDENTITY bằng OUTPUT INSERTED, không dùng MAX(id)', async () => {
  queue.push({ recordset: [{ inserted_id: 42 }], rowsAffected: [1] });
  const result = await db.prepare('INSERT INTO movies (title) VALUES (?)').run('Phim tiếng Việt');
  assert.equal(result.lastInsertRowid, 42);
  assert.equal(result.changes, 1);
  assert.match(records[0].text, /OUTPUT INSERTED.id AS inserted_id VALUES/);
});
test('SQL03: session không có id, expires_at dùng BIGINT', async () => {
  await db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run('abc', 1, 2000000000000);
  assert.doesNotMatch(records[0].text, /OUTPUT/);
  assert.deepEqual(records[0].inputs[2], ['cm_arg_2', 'BIGINT', 2000000000000]);
});
test('SQL04: transaction chỉ commit sau khi mọi truy vấn hoàn thành', async () => {
  await transaction(async () => {
    await db.prepare('UPDATE movies SET title = ? WHERE id = ?').run('Mới', 1);
    await new Promise(resolve => setImmediate(resolve));
    await db.prepare('DELETE FROM contacts WHERE id = ?').run(2);
  });
  assert.equal(records[0].begin, 'SERIALIZABLE');
  assert.equal(records[1].owner, records[0].tx);
  assert.equal(records[2].owner, records[0].tx);
  assert.equal(records[3].commit, true);
});
test('SQL05: lỗi ghế trùng rollback cả vé và ghế', async () => {
  const failure = Object.assign(new Error('duplicate seat'), { number: 2627 });
  queue.push({ recordset: [{ inserted_id: 10 }], rowsAffected: [1] }, new Error('duplicate seat'));
  await assert.rejects(transaction(async () => {
    await db.prepare('INSERT INTO bookings (user_id) VALUES (?)').run(1);
    await db.prepare('INSERT INTO booking_seats (booking_id) VALUES (?)').run(10);
  }), /duplicate seat/);
  assert.ok(records.at(-1).rollback);
  assert.ok(!records.some(r => r.commit));
});
test('SQL06: transaction đồng thời không dùng nhầm kết nối', async () => {
  await Promise.all([1, 2].map(id => transaction(async () => {
    await new Promise(resolve => setImmediate(resolve));
    await db.prepare('SELECT ? AS n').get(id);
  })));
  const requests = records.filter(r => r.text);
  assert.notEqual(requests[0].owner, requests[1].owner);
});
test('SQL07: lỗi ràng buộc SQL Server trả 409', () => {
  const { dbError } = require('../src/utils/text');
  assert.equal(dbError({ number: 2627, message: 'UQ_movies_title' }, { unique: { 'movies.title': 'Tên phim đã tồn tại.' } }).status, 409);
  assert.equal(dbError({ number: 547 }, { fk: 'Đang có vé.' }).message, 'Đang có vé.');
});
test('SQL08: model phim trả dữ liệu sau khi chờ driver', async () => {
  queue.push({ recordset: [{ id: 1, title: 'Truy Kích', release_date: '2000-01-01' }], rowsAffected: [] });
  const result = await require('../src/models/movieModel').findAll();
  assert.equal(result[0].state, 'showing');
  assert.doesNotMatch(records[0].text, /NOCASE/);
});
test('SQL09: thống kê dùng CASE, TOP và GROUP BY hợp lệ T-SQL', async () => {
  queue.push({ recordset: [{ total: 1, pending: 1 }], rowsAffected: [] }, { recordset: [{ tickets: 2, revenue: 100, bookings: 1 }], rowsAffected: [] }, { recordset: [{ n: 1 }], rowsAffected: [] }, { recordset: [{ n: 1 }], rowsAffected: [] });
  const result = await require('../src/models/statsModel').summary();
  assert.equal(result.revenue, 100);
  assert.match(records[0].text, /CASE WHEN/);
  assert.match(records.at(-1).text, /TOP \(5\)/);
});
test('SQL10: phân quyền nạp bất đồng bộ, quyền khách và quản lý tách biệt', async () => {
  queue.push({ recordset: [{ role_code: 'guest', permission_code: 'movie:view' }, { role_code: 'manager', permission_code: 'movie:create' }], rowsAffected: [] });
  const auth = require('../src/middlewares/auth');
  await auth.loadPermissions();
  assert.equal(auth.can(null, 'movie:view'), true);
  assert.equal(auth.can(null, 'movie:create'), false);
  assert.throws(() => auth.authorize('movie:create', null), e => e.status === 401);
  assert.deepEqual(auth.withPermissions({ id: 1, role: 'manager' }).permissions, ['movie:create']);
});
test('SQL11: máy chủ chờ đăng nhập và cookie trước khi trả JSON', async () => {
  const { hashPassword } = require('../src/utils/security');
  queue.push({ recordset: [{ id: 1, role: 'manager', password_hash: hashPassword('Quanly@123') }], rowsAffected: [] }, { recordset: [], rowsAffected: [1] }, { recordset: [{ id: 1, username: 'quanly', role: 'manager' }], rowsAffected: [] });
  const server = require('../server');
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'quanly', password: 'Quanly@123' }) });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie'), /^sid=/);
    assert.equal((await response.json()).user.username, 'quanly');
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('SQL12: Windows Authentication dùng trusted connection, không gửi sa/password', () => {
  const config = require('../src/config');
  assert.equal(config.dbAuth, 'windows');
  assert.equal(config.sqlServer.server, 'NHUY');
  assert.equal(config.sqlServer.database, 'CineManager');
  assert.equal(config.sqlServer.options.instanceName, 'MSSQLSERVER01');
  assert.equal(config.sqlServer.options.trustedConnection, true);
  assert.equal(config.sqlServer.user, undefined);
  assert.equal(config.sqlServer.password, undefined);
  const native = { conn_str: 'Driver={ODBC Driver 18 for SQL Server};' };
  config.sqlServer.beforeConnect(native);
  assert.match(native.conn_str, /TrustServerCertificate=Yes/);
});
