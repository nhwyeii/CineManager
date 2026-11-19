const { db, checkDatabase } = require('../src/db');
(async () => {
  try {
    await checkDatabase();
    console.log('Kết nối SQL Server và phân quyền: OK.');
    console.log(await db.prepare('SELECT DB_NAME() AS database_name, SUSER_SNAME() AS login_name, (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM movies) AS movies').get());
  } catch (err) { console.error('Kiểm tra thất bại:', err.message); process.exitCode = 1; }
  finally { await db.close(); }
})();
