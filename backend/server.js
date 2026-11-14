const express = require('express');
const path = require('node:path');
const { ketNoiDatabase } = require('./src/db');
const { taoRouter } = require('./src/routes');

async function khoiDong() {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT phải là số nguyên từ 1 đến 65535.');
  }

  const pool = await ketNoiDatabase();
  const app = express();

  app.use(taoRouter(pool));

  app.use('/api', (_req, res) => {
    return res.status(404).json({
      thong_bao: 'Không tìm thấy API.'
    });
  });

  app.use(express.static(path.join(__dirname, '../frontend')));

  const server = app.listen(port, () => {
    console.log(`Trang chủ: http://localhost:${port}/`);
    console.log(`API phim: http://localhost:${port}/api/phim`);
  });

  server.once('error', async (loi) => {
    console.error('Không mở được cổng:', loi.message);
    process.exitCode = 1;

    try {
      await pool.close();
    } catch (loiDong) {
      console.error('Không đóng được kết nối SQL Server:', loiDong.message);
    }
  });
}

khoiDong().catch((loi) => {
  console.error('Không khởi động được backend:', loi.message);
  process.exitCode = 1;
});