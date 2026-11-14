const { layTaiKhoan } = require('../models/userModel');

function taoMiddleware(pool, phien) {
  async function canDangNhap(req, res, next) {
    res.set('Cache-Control', 'no-store');

    const ten = phien.layTen(req);
    const taiKhoan = ten ? await layTaiKhoan(pool, ten) : null;

    if (!taiKhoan?.dang_hoat_dong) {
      phien.huy(req, res);
      return res.status(401).json({ thong_bao: 'Vui lòng đăng nhập.' });
    }

    const { ma_nguoi_dung, ten_dang_nhap, ho_ten, vai_tro } = taiKhoan;
    req.taiKhoan = { ma_nguoi_dung, ten_dang_nhap, ho_ten, vai_tro };
    return next();
  }

  function canQuanTri(req, res, next) {
    if (req.taiKhoan?.vai_tro !== 'quan_tri') {
      return res.status(403).json({ thong_bao: 'Cần quyền quản trị.' });
    }

    return next();
  }

  return { canDangNhap, canQuanTri };
}

module.exports = { taoMiddleware };