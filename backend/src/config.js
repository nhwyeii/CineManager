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
  dbFile: path.resolve(projectRoot, env.DB_FILE || 'database/cinema.db'),
  sessionDays: Number(env.SESSION_DAYS) || 7,
  adminPassword: env.ADMIN_PASSWORD || 'Quanly@123'
};
