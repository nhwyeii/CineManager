const { taoMatKhauBam, dungMatKhau } = require('../utils/security');
const { mauTen, chuanHoaTen, matKhauHopLe } = require('../utils/validate');
const { layTaiKhoan, taoTaiKhoan } = require('../models/userModel');
const { taoKhoPhien } = require('../models/sessionModel');
const { taoMiddleware } = require('../middlewares/auth');

function ganApiTaiKhoan(app, pool) {
  const phien = taoKhoPhien();
  const { canDangNhap, canQuanTri } = taoMiddleware(pool, phien);

  app.post('/api/dang-ky', async (req, res) => {
    const { ten_dang_nhap, ho_ten, mat_khau } = req.body || {};
    const ten = chuanHoaTen(ten_dang_nhap);
    const hoTen = typeof ho_ten === 'string' ? ho_ten.trim() : '';

    if (!mauTen.test(ten) || !hoTen || hoTen.length > 100 ||
        !matKhauHopLe(mat_khau)) {
      return res.status(400).json({
        thong_bao: 'Tên đăng nhập cần 3–50 ký tự chữ, số hoặc dấu _. '
          + 'Họ tên tối đa 100 ký tự và mật khẩu cần 8–128 ký tự.'
      });
    }

    try {
      const matKhauBam = await taoMatKhauBam(mat_khau);
      const taiKhoan = await taoTaiKhoan(pool, ten, hoTen, matKhauBam);
      return res.status(201).json(taiKhoan);
    } catch (loi) {
      const cacMaLoi = [
        loi.number,
        loi.code,
        loi.originalError?.number,
        loi.originalError?.code,
        loi.originalError?.info?.number
      ];

      if (cacMaLoi.some((ma) => [2601, 2627].includes(Number(ma)))) {
        return res.status(409).json({
          thong_bao: 'Tên đăng nhập đã được sử dụng.'
        });
      }

      throw loi;
    }
  });

  app.post('/api/dang-nhap', async (req, res) => {
    const { ten_dang_nhap, mat_khau } = req.body || {};
    const ten = chuanHoaTen(ten_dang_nhap);
    const thongBaoSai = {
      thong_bao: 'Tên đăng nhập hoặc mật khẩu không đúng.'
    };

    res.set('Cache-Control', 'no-store');
    if (!mauTen.test(ten) || !matKhauHopLe(mat_khau)) {
      return res.status(401).json(thongBaoSai);
    }

    const taiKhoan = await layTaiKhoan(pool, ten);
    const hopLe = await dungMatKhau(mat_khau, taiKhoan?.mat_khau_bam);

    if (!taiKhoan?.dang_hoat_dong || !hopLe) {
      return res.status(401).json(thongBaoSai);
    }

    phien.cap(req, res, taiKhoan.ten_dang_nhap);
    const { ma_nguoi_dung, ten_dang_nhap: tenTaiKhoan, ho_ten, vai_tro } = taiKhoan;

    return res.json({
      thong_bao: 'Xác thực thành công.',
      ma_nguoi_dung,
      ten_dang_nhap: tenTaiKhoan,
      ho_ten,
      vai_tro
    });
  });

  app.get('/api/tai-khoan', canDangNhap, (req, res) => {
    return res.json(req.taiKhoan);
  });

  app.post('/api/dang-xuat', (req, res) => {
    phien.huy(req, res);
    return res.status(204).end();
  });

  return { canDangNhap, canQuanTri };
}

module.exports = { ganApiTaiKhoan };