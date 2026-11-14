const sql = require('mssql/msnodesqlv8');

function ketNoiDatabase() {
  const { DB_SERVER, DB_NAME } = process.env;

  if (!DB_SERVER || !DB_NAME) {
    throw new Error('Thiếu DB_SERVER hoặc DB_NAME trong file .env.');
  }

  const chuoiKetNoi = [
    'Driver={ODBC Driver 18 for SQL Server}',
    `Server=${DB_SERVER}`,
    `Database=${DB_NAME}`,
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
}

module.exports = { ketNoiDatabase };
