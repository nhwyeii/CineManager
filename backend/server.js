const express = require('express');
const path = require('node:path');
const { ketNoiDatabase } = require('./src/db');
const { ganApiTaiKhoan } = require('./src/auth');

const app = express();

app.use(express.json({ limit: '8kb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

async function khoiDong() {
  const pool = await ketNoiDatabase();

  app.get('/api/phim', async (req, res) => {
    const ketQua = await pool.request().query(`
      SELECT ma_phim, ten_phim, the_loai, thoi_luong_phut, mo_ta
      FROM dbo.phim
      ORDER BY ma_phim;
    `);

    return res.json(ketQua.recordset);
  });

  ganApiTaiKhoan(app, pool);

  app.use((loi, req, res, next) => {
    if (res.headersSent) return next(loi);

    if (loi.status === 400 || loi.status === 413) {
      return res.status(loi.status).json({
        thong_bao: 'Dữ liệu gửi lên không hợp lệ.'
      });
    }

    console.error(loi.message);
    return res.status(500).json({
      thong_bao: 'Máy chủ không xử lý được yêu cầu.'
    });
  });

  const port = Number(process.env.PORT || 3001);
  app.listen(port, (loi) => {
    if (loi) {
      console.error('Không mở được cổng:', loi.message);
      process.exitCode = 1;
      pool.close().catch((loiDong) => console.error(loiDong.message));
      return;
    }

    console.log(`CineManager: http://localhost:${port}`);
  });
}

khoiDong().catch((loi) => {
  console.error('Không khởi động được backend:', loi.message);
  process.exitCode = 1;
});