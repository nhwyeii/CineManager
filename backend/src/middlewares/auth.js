// Middleware: xác định người dùng từ cookie + kiểm tra quyền truy cập route (RBAC)
// Quyền của từng vai trò nằm trong CSDL (bảng role_permissions, nạp từ database/01_CauTruc_PhanQuyen.sql).
const { db } = require('../db');
const security = require('../utils/security');
const sessionModel = require('../models/sessionModel');
const { HttpError } = require('../utils/http');

// Cache: vai trò -> tập mã quyền (đọc 1 lần từ CSDL)
let cache = null;
async function loadPermissions() {
  const next = new Map();
  for (const r of await db.prepare('SELECT role_code, permission_code FROM role_permissions').all()) {
    if (!next.has(r.role_code)) next.set(r.role_code, new Set());
    next.get(r.role_code).add(r.permission_code);
  }
  cache = next;
}
function rolePermissions(role) {
  if (!cache) throw new Error('Chưa nạp phân quyền khi khởi động.');
  return cache.get(role) || new Set();
}

// user = null nghĩa là khách vãng lai (guest)
function can(user, permission) {
  return rolePermissions(user ? user.role : 'guest').has(permission);
}

// Gắn danh sách quyền vào user để giao diện ẩn/hiện chức năng (server vẫn kiểm tra lại mọi API)
function withPermissions(user) {
  return user ? Object.assign({}, user, { permissions: Array.from(rolePermissions(user.role)).sort() }) : user;
}

// Trả về user đang đăng nhập (hoặc null)
async function getUser(req) {
  const token = security.parseCookies(req).sid;
  if (!token) return null;
  const hash = security.sha256(token);
  const row = await sessionModel.findUser(hash);
  if (!row) return null;
  if (row.expires_at < Date.now()) { await sessionModel.remove(hash); return null; }
  delete row.expires_at;
  return row;
}

// access: 'public' (không cần quyền), mã quyền (VD 'movie:create') hoặc mảng mã quyền (có 1 trong các quyền là được)
function authorize(access, user) {
  if (access === 'public') return;
  if ([].concat(access).some((perm) => can(user, perm))) return;
  if (!user) throw new HttpError(401, 'Bạn cần đăng nhập để thực hiện chức năng này.');
  throw new HttpError(403, 'Bạn không có quyền thực hiện chức năng này.');
}

module.exports = { getUser, authorize, can, withPermissions, loadPermissions };
