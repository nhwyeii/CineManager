// Tiện ích HTTP: lỗi chuẩn, đọc JSON body, trả JSON
class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors; // lỗi theo từng trường: { field: 'message' }
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const type = String(req.headers['content-type'] || '');
    const len = req.headers['content-length'];
    const empty = (len === undefined || len === '0') && !req.headers['transfer-encoding'];
    if (empty) return resolve({}); // không có body (VD: đăng xuất)
    if (!type.includes('application/json')) {
      return reject(new HttpError(415, 'Dữ liệu gửi lên phải là JSON.'));
    }
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 100 * 1024) {
        reject(new HttpError(413, 'Dữ liệu gửi lên quá lớn.'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        if (data === null || typeof data !== 'object' || Array.isArray(data)) throw new Error();
        resolve(data);
      } catch (e) {
        reject(new HttpError(400, 'JSON không hợp lệ.'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data, headers) {
  const body = JSON.stringify(data);
  res.writeHead(status, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  }, headers || {}));
  res.end(body);
}

module.exports = { HttpError, readJson, sendJson };
