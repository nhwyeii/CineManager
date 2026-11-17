// Bảo mật: băm mật khẩu (scrypt + salt), token phiên, cookie HttpOnly
const crypto = require('crypto');
const config = require('../config');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const real = Buffer.from(hash, 'hex');
  return real.length === test.length && crypto.timingSafeEqual(real, test);
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Tạo token phiên ngẫu nhiên; trả về token gốc (gửi cho trình duyệt) và hash (lưu DB)
function newToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: sha256(token), maxAge: config.sessionDays * 86400, expires: Date.now() + config.sessionDays * 86400000 };
}

function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function cookieHeader(token, maxAge) {
  return 'sid=' + token + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=' + maxAge;
}

module.exports = { hashPassword, verifyPassword, newToken, cookieHeader, parseCookies, sha256 };
