const { randomBytes } = require('node:crypto');
const sql = require('mssql/msnodesqlv8');
const { ketNoiDatabase } = require('../backend/src/db');
const { taoMatKhauBam } = require('../backend/src/utils/security');

async function themDuLieuMau() {
  const pool = await ketNoiDatabase();

  try {
    const matKhauDemo = randomBytes(12).toString('hex');
    const matKhauBam = await taoMatKhauBam(matKhauDemo);

    await pool.request().input('matKhauBam', sql.VarChar(255), matKhauBam).query(`
      SET XACT_ABORT ON;
      BEGIN TRANSACTION;

      IF EXISTS (SELECT 1 FROM dbo.nguoi_dung WITH (UPDLOCK, HOLDLOCK))
        OR EXISTS (SELECT 1 FROM dbo.phim WITH (UPDLOCK, HOLDLOCK))
        OR EXISTS (SELECT 1 FROM dbo.phong_chieu WITH (UPDLOCK, HOLDLOCK))
        OR EXISTS (SELECT 1 FROM dbo.suat_chieu WITH (UPDLOCK, HOLDLOCK))
        OR EXISTS (SELECT 1 FROM dbo.dat_ve WITH (UPDLOCK, HOLDLOCK))
      BEGIN
        THROW 50001, N'Chỉ chạy seed khi cả 5 bảng đang trống.', 1;
      END;

      INSERT dbo.nguoi_dung (ten_dang_nhap, ho_ten, mat_khau_bam, vai_tro, dang_hoat_dong)
      VALUES ('demo_admin', N'Quản trị mẫu', @matKhauBam, 'quan_tri', 1),
             ('demo_mai', N'Ngọc Mai', @matKhauBam, 'khach_hang', 1),
             ('demo_nam', N'Hoàng Nam', @matKhauBam, 'khach_hang', 1),
             ('demo_lan', N'Thùy Lan', @matKhauBam, 'khach_hang', 1),
             ('demo_thao', N'Phương Thảo', @matKhauBam, 'khach_hang', 0);

      INSERT dbo.phim (ten_phim, the_loai, thoi_luong_phut)
      VALUES (N'Hành trình mùa hè', N'Phiêu lưu', 105),
             (N'Chú mèo đi lạc', N'Hoạt hình', 90),
             (N'Mật mã lúc nửa đêm', N'Hành động', 120),
             (N'Mưa qua phố cũ', N'Tình cảm', 100),
             (N'Căn phòng cuối hành lang', N'Kinh dị', 95);

      INSERT dbo.phong_chieu (ten_phong, suc_chua)
      VALUES (N'Mini', 10), (N'Tiêu chuẩn', 60), (N'Lớn', 100),
             (N'VIP', 20), (N'Sự kiện', 150);

      DECLARE @ngay DATETIME2(0) =
        DATEADD(DAY, 1, CONVERT(DATETIME2(0), CONVERT(DATE, SYSDATETIME())));

      INSERT dbo.suat_chieu (ma_phim, ma_phong, gio_bat_dau, gio_ket_thuc, gia_ve)
      SELECT p.ma_phim, pc.ma_phong, DATEADD(HOUR, m.gio, @ngay),
             DATEADD(MINUTE, p.thoi_luong_phut, DATEADD(HOUR, m.gio, @ngay)),
             m.gia
      FROM (VALUES
        (N'Chú mèo đi lạc', N'Mini', 9, 50000),
        (N'Hành trình mùa hè', N'Tiêu chuẩn', 9, 75000),
        (N'Mật mã lúc nửa đêm', N'Lớn', 18, 90000),
        (N'Mưa qua phố cũ', N'VIP', 14, 120000),
        (N'Căn phòng cuối hành lang', N'Sự kiện', 21, 0)
      ) AS m(phim, phong, gio, gia)
      JOIN dbo.phim AS p ON p.ten_phim = m.phim
      JOIN dbo.phong_chieu AS pc ON pc.ten_phong = m.phong;

      INSERT dbo.dat_ve
        (ma_nguoi_dung, ma_suat_chieu, so_luong, don_gia_luc_dat, trang_thai)
      SELECT nd.ma_nguoi_dung, sc.ma_suat_chieu, m.so_luong, m.gia, m.trang_thai
      FROM (VALUES
        ('demo_mai', N'Mini', 10, 50000, 'da_xac_nhan'),
        ('demo_nam', N'Mini', 2, 50000, 'da_huy'),
        ('demo_mai', N'Tiêu chuẩn', 1, 70000, 'da_xac_nhan'),
        ('demo_lan', N'VIP', 3, 120000, 'da_xac_nhan'),
        ('demo_nam', N'Sự kiện', 2, 0, 'da_xac_nhan')
      ) AS m(ten, phong, so_luong, gia, trang_thai)
      JOIN dbo.nguoi_dung AS nd ON nd.ten_dang_nhap = m.ten
      JOIN dbo.phong_chieu AS pc ON pc.ten_phong = m.phong
      JOIN dbo.suat_chieu AS sc ON sc.ma_phong = pc.ma_phong;

      COMMIT TRANSACTION;
    `);

    console.log('Đã thêm 5 dòng mỗi bảng. Mật khẩu demo:', matKhauDemo);
  } finally {
    await pool.close();
  }
}

themDuLieuMau().catch((loi) => {
  console.error('Không thêm được dữ liệu mẫu:', loi.message);
  process.exitCode = 1;
});