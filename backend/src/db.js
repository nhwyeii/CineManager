const sql = require('mssql/msnodesqlv8');

function ketNoiDatabase() {
  const chuoiKetNoi = [
    'Driver={ODBC Driver 18 for SQL Server}',
    `Server=${process.env.DB_SERVER}`,
    `Database=${process.env.DB_NAME}`,
    'Trusted_Connection=Yes',
    'Encrypt=Yes',
    'TrustServerCertificate=Yes'
  ].join(';');

  return sql.connect({ connectionString: chuoiKetNoi });
}

async function kiemTraKetNoi() {
  const pool = await ketNoiDatabase();

  try {
    const ketQua = await pool.request().query(`
      SELECT ma_phim, ten_phim, the_loai
      FROM dbo.phim
      ORDER BY ma_phim;
    `);

    console.table(ketQua.recordset);
  } finally {
    await pool.close();
  }
}

if (require.main === module) {
  kiemTraKetNoi().catch((loi) => {
    console.error('Lỗi kết nối hoặc truy vấn:', loi.message);
    process.exitCode = 1;
  });
}

module.exports = { ketNoiDatabase };