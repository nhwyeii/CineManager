const express = require('express');
const { ketNoiDatabase } = require('./src/db');

const app = express();
const path = require('node:path');
app.use(express.static(path.join(__dirname, '../frontend')));

async function khoiDong() {
  const pool = await ketNoiDatabase();

  app.get('/api/phim', async (req, res) => {
    try {
      const ketQua = await pool.request().query(`
        SELECT ma_phim, ten_phim, the_loai, thoi_luong_phut, mo_ta
        FROM dbo.phim
        ORDER BY ma_phim;
      `);

      res.json(ketQua.recordset);
    } catch (loi) {
      console.error(loi.message);
      res.status(500).json({ thong_bao: 'Không tải được danh sách phim.' });
    }
  });

  app.listen(3000, () => {
    console.log('API phim: http://localhost:3000/api/phim');
  });
}

khoiDong().catch((loi) => {
  console.error('Không khởi động được backend:', loi.message);
  process.exitCode = 1;
});