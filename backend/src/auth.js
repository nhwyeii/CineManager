const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const sql = require('mssql/msnodesqlv8');

const bamMatKhau = promisify(scrypt);

function ganApiTaiKhoan(app, pool) {
  app.post('/api/dang-ky', async (req, res) => {
    const { ten_dang_nhap, ho_ten, mat_khau } = req.body || {};

    const ten = typeof ten_dang_nhap === 'string'
      ? ten_dang_nhap.trim().toLowerCase()
      : '';
    const hoTen = typeof ho_ten === 'string' ? ho_ten.trim() : '';

    if (
      !/^[a-z0-9_]{3,50}$/.test(ten) ||
      !hoTen || hoTen.length > 100 ||
      typeof mat_khau !== 'string' ||
      mat_khau.length < 8 || mat_khau.length > 128
    ) {
      return res.status(400).json({
        thong_bao: 'Tên đăng nhập cần 3–50 ký tự (chữ, số hoặc dấu _), họ tên tối đa 100 ký tự và mật khẩu từ 8–128 ký tự.'
      });
    }

    try {
      const salt = randomBytes(16).toString('hex');
      const khoa = await bamMatKhau(mat_khau, salt, 64);
      const matKhauBam = `${salt}:${khoa.toString('hex')}`;

      const ketQua = await pool.request()
        .input('ten', sql.VarChar(50), ten)
        .input('hoTen', sql.NVarChar(100), hoTen)
        .input('matKhauBam', sql.VarChar(255), matKhauBam)
        .query(`
          INSERT INTO dbo.nguoi_dung
            (ten_dang_nhap, ho_ten, mat_khau_bam, vai_tro)
          OUTPUT INSERTED.ma_nguoi_dung, INSERTED.ten_dang_nhap,
                 INSERTED.ho_ten, INSERTED.vai_tro
          VALUES (@ten, @hoTen, @matKhauBam, 'khach_hang');
        `);

      return res.status(201).json(ketQua.recordset[0]);
    } catch (loi) {
      const trungTen = [2601, 2627].some((ma) =>
        [loi.number, loi.code, loi.originalError?.number,
          loi.originalError?.code].some((giaTri) => Number(giaTri) === ma)
      );

      if (trungTen) {
        return res.status(409).json({
          thong_bao: 'Tên đăng nhập đã được sử dụng.'
        });
      }

      console.error('Lỗi đăng ký:', loi.message);
      return res.status(500).json({ thong_bao: 'Không tạo được tài khoản.' });
    }
  });
    app.post('/api/dang-nhap', async (req, res) => {
    const { ten_dang_nhap, mat_khau } = req.body || {};
    const ten = typeof ten_dang_nhap === 'string'
      ? ten_dang_nhap.trim().toLowerCase()
      : '';

    const thongBaoSai = {
      thong_bao: 'Tên đăng nhập hoặc mật khẩu không đúng.'
    };

    if (
      !/^[a-z0-9_]{3,50}$/.test(ten) ||
      typeof mat_khau !== 'string' ||
      mat_khau.length < 8 ||
      mat_khau.length > 128
    ) {
      return res.status(401).json(thongBaoSai);
    }

    try {
      const ketQua = await pool.request()
        .input('ten', sql.VarChar(50), ten)
        .query(`
          SELECT ten_dang_nhap, ho_ten, mat_khau_bam,
                 vai_tro, dang_hoat_dong
          FROM dbo.nguoi_dung
          WHERE ten_dang_nhap = @ten;
        `);

      const taiKhoan = ketQua.recordset[0];
      const banBam = taiKhoan?.mat_khau_bam || '';
      const coBanBam = /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(banBam);

      const [salt, chuoiBam] = coBanBam
        ? banBam.split(':')
        : ['0'.repeat(32), '0'.repeat(128)];

      const khoa = await bamMatKhau(mat_khau, salt, 64);
      const dungMatKhau = timingSafeEqual(khoa, Buffer.from(chuoiBam, 'hex'));

      if (!taiKhoan?.dang_hoat_dong || !coBanBam || !dungMatKhau) {
        return res.status(401).json(thongBaoSai);
      }

      return res.json({
        thong_bao: 'Xác thực thành công.',
        ten_dang_nhap: taiKhoan.ten_dang_nhap,
        ho_ten: taiKhoan.ho_ten,
        vai_tro: taiKhoan.vai_tro
      });
    } catch (loi) {
      console.error('Lỗi đăng nhập:', loi.message);
      return res.status(500).json({
        thong_bao: 'Không xử lý được đăng nhập.'
      });
    }
  });
}

module.exports = { ganApiTaiKhoan };