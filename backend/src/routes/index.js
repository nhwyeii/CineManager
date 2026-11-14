const express = require('express');

function taoRouter(pool) {
  const router = express.Router();

  router.get('/api/phim', async (_req, res) => {
    try {
      const ketQua = await pool.request().query(`
        SELECT ma_phim, ten_phim, the_loai, thoi_luong_phut, mo_ta
        FROM dbo.phim
        ORDER BY ma_phim;
      `);

      return res.json(ketQua.recordset);
    } catch (loi) {
      console.error('Lỗi đọc danh sách phim:', loi.message);
      return res.status(500).json({
        thong_bao: 'Không tải được danh sách phim.'
      });
    }
  });

  return router;
}

module.exports = { taoRouter };