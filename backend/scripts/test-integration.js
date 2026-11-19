// Tạo database test mới, nạp hai script, chạy API tests, rồi xóa đúng database đó.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const sql = require('../src/sql-client');
const config = require('../src/config');
const name = 'CineManagerTest_' + Date.now() + '_' + process.pid;
const master = new sql.ConnectionPool({ ...config.sqlServer, database: 'master' });
let target, created = false;
(async () => {
  try {
    await master.connect();
    await master.request().query('CREATE DATABASE [' + name + ']'); created = true;
    target = await new sql.ConnectionPool({ ...config.sqlServer, database: name }).connect();
    for (const file of ['01_CauTruc_PhanQuyen.sql', '02_DuLieuMau.sql']) {
      const source = fs.readFileSync(path.join(config.databaseDir, file), 'utf8');
      const body = source.slice(source.indexOf('SET XACT_ABORT'));
      for (const batch of body.split(/^GO\s*$/mi).filter(s => s.trim())) await target.request().batch(batch);
    }
    await target.close(); target = null;
    const child = spawn(process.execPath, ['--test', 'tests/api.test.js'], {
      cwd: path.join(__dirname, '..'), stdio: 'inherit', env: { ...process.env, DB_NAME: name }
    });
    process.exitCode = await new Promise((resolve, reject) => { child.on('exit', code => resolve(code || 0)); child.on('error', reject); });
  } catch (err) { console.error('Integration test:', err.message); process.exitCode = 1; }
  finally {
    if (target) await target.close();
    if (created) await master.request().query('ALTER DATABASE [' + name + '] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [' + name + ']');
    await master.close();
  }
})();
