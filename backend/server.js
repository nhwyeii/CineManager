// CineManager - Node.js + SQL Server. Chạy npm start sau khi tạo database trong SSMS.
const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./src/config');
const { getUser, authorize } = require('./src/middlewares/auth');
const { HttpError, readJson, sendJson } = require('./src/utils/http');
const { checkDatabase, db } = require('./src/db');
const { loadPermissions } = require('./src/middlewares/auth');
const { routes } = require('./src/routes');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "font-src 'self' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'"
};

function serveStatic(req, res, pathname) {
  if (pathname === '/') pathname = '/index.html';
  const file = path.normalize(path.join(config.publicDir, decodeURIComponent(pathname)));
  // Chặn truy cập ra ngoài thư mục public (path traversal)
  if (!file.startsWith(config.publicDir + path.sep)) return notFound(res);
  fs.readFile(file, (err, data) => {
    if (err) return notFound(res);
    res.writeHead(200, Object.assign({ 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' }, SECURITY_HEADERS));
    res.end(data);
  });
}

function notFound(res) {
  res.writeHead(404, Object.assign({ 'Content-Type': 'text/html; charset=utf-8' }, SECURITY_HEADERS));
  res.end('<!doctype html><meta charset="utf-8"><title>404</title><body style="font-family:sans-serif;text-align:center;padding:4rem"><h1>404</h1><p>Không tìm thấy trang.</p><a href="/">Về trang chủ</a>');
}

async function handleApi(req, res, url) {
  try {
    const route = routes.find((r) => r.method === req.method && r.regex.test(url.pathname));
    if (!route) {
      const known = routes.some((r) => r.regex.test(url.pathname));
      throw new HttpError(known ? 405 : 404, known ? 'Phương thức không được hỗ trợ.' : 'API không tồn tại.');
    }
    const user = await getUser(req);
    authorize(route.access, user);

    const m = url.pathname.match(route.regex);
    const params = {};
    route.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
    const query = Object.fromEntries(url.searchParams);
    const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await readJson(req) : {};

    const out = await route.handler({ req, user, params, query, body });
    sendJson(res, out.status || 200, out.data, out.cookie ? { 'Set-Cookie': out.cookie } : undefined);
  } catch (err) {
    if (err instanceof HttpError) {
      sendJson(res, err.status, { message: err.message, errors: err.errors || undefined });
    } else {
      console.error('Lỗi máy chủ:', err);
      sendJson(res, 500, { message: 'Lỗi máy chủ, vui lòng thử lại sau.' });
    }
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405); return res.end();
  }
  try { serveStatic(req, res, url.pathname); } catch (e) { notFound(res); }
});

async function initialize() {
  await checkDatabase();
  await loadPermissions();
}
if (require.main === module) {
  initialize().then(() => {
    server.listen(config.port, () => console.log('CineManager (SQL Server) đang chạy tại http://localhost:' + config.port));
    server.on('error', async err => { console.error('Không mở được web:', err.message); await db.close(); process.exitCode = 1; });
  }).catch(async err => {
    console.error('Không khởi động được SQL Server:', err.message);
    console.error('Kiểm tra backend/.env và chạy 2 file SQL trong SSMS. Chạy npm run db:check để kiểm tra kết nối.');
    await db.close();
    process.exitCode = 1;
  });
}
server.initialize = initialize;
module.exports = server;
