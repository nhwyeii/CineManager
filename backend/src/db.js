// SQL Server: truy vấn có tham số và transaction dùng cùng một kết nối.
const sql = require('./sql-client');
const { AsyncLocalStorage } = require('node:async_hooks');
const config = require('./config');

const context = new AsyncLocalStorage();
const pool = new sql.ConnectionPool(config.sqlServer);

let connecting;

function connect() {
  if (!connecting) {
    connecting = pool.connect().catch((err) => {
      connecting = null;
      throw err;
    });
  }

  return connecting;
}

// Đổi dấu ? thành tham số riêng, tránh trùng tên nội bộ của driver.
function parameterize(text, values) {
  let index = 0;

  const query = text.replace(
    /'(?:''|[^'])*'|\?/g,
    (token) => token === '?' ? '@cm_arg_' + index++ : token
  );

  if (index !== values.length) {
    throw new Error('Số tham số SQL không khớp.');
  }

  return query;
}

async function execute(text, values = [], insertId = false) {
  await connect();

  const request = new sql.Request(context.getStore() || pool);

  values.forEach((value, i) => {
    const name = 'cm_arg_' + i;

    if (
      typeof value === 'number' &&
      Number.isInteger(value) &&
      Math.abs(value) > 2147483647
    ) {
      request.input(name, sql.BigInt, value);
    } else {
      request.input(name, value === undefined ? null : value);
    }
  });

  let query = parameterize(text, values);

  if (insertId) {
    query = query.replace(
      /\bVALUES\s*\(/i,
      'OUTPUT INSERTED.id AS inserted_id VALUES ('
    );
  }

  return request.query(query);
}

const db = {
  prepare(text) {
    return {
      async all(...values) {
        const result = await execute(text, values);
        return result.recordset || [];
      },

      async get(...values) {
        const result = await execute(text, values);
        return result.recordset?.[0];
      },

      async run(...values) {
        const insertId =
          /^\s*INSERT\s+INTO\s+(users|movies|rooms|showtimes|bookings|booking_seats|contacts)\b/i.test(text);

        const result = await execute(text, values, insertId);

        return {
          changes: result.rowsAffected.reduce(
            (total, count) => total + count,
            0
          ),
          lastInsertRowid: result.recordset?.[0]?.inserted_id
        };
      }
    };
  },

  async close() {
    await pool.close();
    connecting = null;
  }
};

async function transaction(fn) {
  if (context.getStore()) {
    return fn();
  }

  await connect();

  const tx = new sql.Transaction(pool);
  let rolledBack = false;

  tx.on('rollback', () => {
    rolledBack = true;
  });

  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

  try {
    const result = await context.run(tx, fn);
    await tx.commit();
    return result;
  } catch (err) {
    if (!rolledBack) {
      try {
        await tx.rollback();
      } catch (_) {
        // Giữ nguyên lỗi ban đầu nếu rollback không thực hiện được.
      }
    }

    throw err;
  }
}

async function checkDatabase() {
  await connect();

  const row = await db.prepare(
    "SELECT OBJECT_ID(N'dbo.role_permissions', N'U') AS object_id"
  ).get();

  if (!row?.object_id) {
    throw new Error(
      'Chưa tạo bảng. Chạy database/01_CauTruc_PhanQuyen.sql trong SSMS trước.'
    );
  }

  const roles = await db.prepare(
    'SELECT COUNT(*) AS n FROM role_permissions'
  ).get();

  if (!roles?.n) {
    throw new Error(
      'Thiếu dữ liệu phân quyền. Kiểm tra file 01_CauTruc_PhanQuyen.sql.'
    );
  }
}

module.exports = {
  db,
  transaction,
  connect,
  checkDatabase,
  parameterize
};