// Đọc cấu hình từ file .env (không commit .env lên GitHub)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');          // thư mục backend/
const projectRoot = path.join(root, '..');        // thư mục gốc CineManager/

function loadEnvFile() {
  const env = {};
  const file = path.join(root, '.env');
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (line.trim().startsWith('#')) continue;
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = Object.assign({}, loadEnvFile(), process.env);

module.exports = {
  root,
  projectRoot,
  databaseDir: path.join(projectRoot, 'database'),
  publicDir: path.join(root, '..', 'frontend'),
  port: Number(env.PORT) || 3000,
  dbAuth: env.DB_AUTH || 'windows',
  sqlServer: {
    server: env.DB_SERVER || 'NHUY',
    database: env.DB_NAME || 'CineManager',
    ...((env.DB_AUTH || 'windows') === 'windows'
      ? { driver: env.DB_ODBC_DRIVER || 'ODBC Driver 18 for SQL Server' }
      : { user: env.DB_USER || 'sa', password: env.DB_PASSWORD || '' }),
    ...((env.DB_INSTANCE === undefined ? 'MSSQLSERVER01' : env.DB_INSTANCE) ? {} : { port: Number(env.DB_PORT) || 1433 }),
    options: {
      encrypt: env.DB_ENCRYPT === 'true',
      trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
      trustedConnection: (env.DB_AUTH || 'windows') === 'windows',
      ...((env.DB_INSTANCE === undefined ? 'MSSQLSERVER01' : env.DB_INSTANCE)
        ? { instanceName: env.DB_INSTANCE === undefined ? 'MSSQLSERVER01' : env.DB_INSTANCE } : {})
    },
    beforeConnect(connection) {
      if ((env.DB_AUTH || 'windows') === 'windows')
        connection.conn_str += ';TrustServerCertificate=' + (env.DB_TRUST_SERVER_CERTIFICATE !== 'false' ? 'Yes' : 'No') + ';';
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    connectionTimeout: 15000,
    requestTimeout: 30000
  },
  sessionDays: Number(env.SESSION_DAYS) || 7,
  adminPassword: env.ADMIN_PASSWORD || 'Quanly@123'
};
