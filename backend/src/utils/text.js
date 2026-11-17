// Hàm tiện ích dùng chung cho controller
const { HttpError } = require('./http');

// Bỏ dấu tiếng Việt + chữ thường để tìm "hanh dong" ra "Hành động"
function normalize(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
}

function validationFail(errors) {
  return new HttpError(422, 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.', errors);
}

function paginate(list, query, defaultLimit) {
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(1, parseInt(query.page, 10) || 1), totalPages);
  return { items: list.slice((page - 1) * limit, page * limit), total, page, limit, totalPages };
}

// Chuyển lỗi ràng buộc của SQLite thành thông báo thân thiện
function dbError(err, messages) {
  const msg = String(err && err.message);
  if (msg.includes('UNIQUE constraint failed')) {
    const key = Object.keys(messages.unique || {}).find((k) => msg.includes(k));
    return new HttpError(409, key ? messages.unique[key] : 'Dữ liệu bị trùng.');
  }
  if (msg.includes('FOREIGN KEY constraint failed')) return new HttpError(409, messages.fk || 'Dữ liệu đang được sử dụng ở nơi khác.');
  return err;
}

function needId(p) {
  const id = Number(p.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'Mã không hợp lệ.');
  return id;
}

const hasErrors = (e) => Object.keys(e).length > 0;

module.exports = { normalize, validationFail, paginate, dbError, needId, hasErrors };
