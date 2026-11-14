const sql = require('mssql/msnodesqlv8');

async function layTaiKhoan(pool, ten) {
  const ketQua = await pool.request()
    .input('ten', sql.VarChar(50), ten)
    .query(`
      SELECT ma_nguoi_dung, ten_dang_nhap, ho_ten, mat_khau_bam,
             vai_tro, dang_hoat_dong
      FROM dbo.nguoi_dung
      WHERE ten_dang_nhap = @ten;
    `);

  return ketQua.recordset[0];
}

async function taoTaiKhoan(pool, ten, hoTen, matKhauBam) {
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

  return ketQua.recordset[0];
}

module.exports = { layTaiKhoan, taoTaiKhoan };