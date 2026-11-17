// Controller: đặt vé (chọn ghế cụ thể), vé của tôi, hủy vé
const bookingModel = require('../models/bookingModel');
const showtimeModel = require('../models/showtimeModel');
const seats = require('../utils/seats');
const { transaction } = require('../db');
const { HttpError } = require('../utils/http');
const { validationFail, needId, hasErrors } = require('../utils/text');
const userModel = require('../models/userModel');
const { can } = require('../middlewares/auth');

const isPast = (s) => new Date(s.show_date + 'T' + s.show_time + ':00').getTime() < Date.now();

// Body: { showtime_id, seat_labels: ['A1','A2'] }  (chọn ghế)  hoặc  { showtime_id, seats: 2 } (tự xếp ghế trống đầu tiên)
// Bán tại quầy (nhân viên / quản lý): bắt buộc customer_phone, tùy chọn customer_name
exports.create = ({ body, user }) => {
  // Nhân viên / quản lý luôn là bán tại quầy và BẮT BUỘC nhập số điện thoại khách. Khách hàng không được tự nhận bán quầy.
  const counter = can(user, 'booking:sell_counter');
  if (!counter && (body.channel === 'counter' || body.customer_phone)) throw new HttpError(403, 'Chỉ nhân viên mới được bán vé tại quầy.');
  let ownerId = user.id, customer = {};
  if (counter) {
    const phone = String(body.customer_phone || '').trim();
    if (!phone) throw validationFail({ customer_phone: 'Nhập số điện thoại khách hàng để bán vé.' });
    if (!/^0\d{9,10}$/.test(phone)) throw validationFail({ customer_phone: 'Số điện thoại không hợp lệ (VD: 0912345678).' });
    const known = userModel.findCustomerByPhone(phone); // khách đã có tài khoản thì vé nằm trong "Vé của tôi" của họ
    if (known) ownerId = known.id;
    customer = { phone, name: known ? null : (String(body.customer_name || '').trim().slice(0, 80) || 'Khách vãng lai') };
  }
  const showtimeId = Number(body.showtime_id);
  const errors = {};
  let wanted = null, count = 0;
  if (Array.isArray(body.seat_labels)) {
    wanted = body.seat_labels.map((x) => String(x).trim().toUpperCase());
    if (new Set(wanted).size !== wanted.length) errors.seat_labels = 'Danh sách ghế bị trùng.';
    count = wanted.length;
    if (count < 1 || count > 10) errors.seat_labels = 'Chọn từ 1 đến 10 ghế.';
  } else {
    count = Number(body.seats);
    if (!Number.isInteger(count) || count < 1 || count > 10) errors.seats = 'Số vé là số nguyên từ 1 đến 10.';
  }
  if (hasErrors(errors)) throw validationFail(errors);

  // Kiểm tra + ghi vé trong 1 transaction; UNIQUE(showtime_id, seat_label) là chốt chặn cuối cùng chống bán trùng ghế
  return transaction(() => {
    const s = Number.isInteger(showtimeId) ? showtimeModel.findById(showtimeId) : null;
    if (!s) throw new HttpError(404, 'Không tìm thấy suất chiếu.');
    if (s.status !== 'Pending' || isPast(s)) throw new HttpError(409, 'Suất chiếu này đã chiếu, không thể đặt vé.');
    const taken = new Set(showtimeModel.takenSeats(s.id));
    let labels;
    if (wanted) {
      const valid = new Set(seats.flat(s.capacity).map((x) => x.label));
      const bad = wanted.filter((l) => !valid.has(l));
      if (bad.length) throw new HttpError(422, 'Ghế không tồn tại trong phòng: ' + bad.join(', ') + '.', { seat_labels: 'Ghế không hợp lệ: ' + bad.join(', ') });
      const busy = wanted.filter((l) => taken.has(l));
      if (busy.length) throw new HttpError(409, 'Ghế ' + busy.join(', ') + ' vừa có người đặt. Vui lòng chọn ghế khác.', { seat_labels: 'Ghế đã bán: ' + busy.join(', ') });
      labels = seats.sortLabels(wanted);
    } else {
      const free = seats.flat(s.capacity).filter((x) => !taken.has(x.label));
      if (count > free.length) throw new HttpError(409, free.length > 0 ? 'Chỉ còn ' + free.length + ' ghế trống.' : 'Suất chiếu đã hết vé.', { seats: 'Chỉ còn ' + free.length + ' ghế.' });
      labels = free.slice(0, count).map((x) => x.label);
    }
    const total = seats.totalPrice(labels, s.capacity, s.price);
    const id = counter ? bookingModel.create(ownerId, s.id, labels, total, 'counter', user.id, customer) : bookingModel.create(user.id, s.id, labels, total);
    return { status: 201, data: { message: 'Đặt vé thành công: ' + labels.join(', ') + '.', id, code: 'CM' + String(id).padStart(6, '0'), seat_labels: labels, total_price: total } };
  });
};

// Nhân viên / quản lý xem mọi vé
exports.list = () => ({ data: { items: bookingModel.findAll() } });

exports.mine = ({ user }) => ({ data: { items: bookingModel.findByUser(user.id) } });

exports.cancel = ({ params, user }) => {
  const id = needId(params);
  // Khách hàng chỉ hủy được vé CỦA MÌNH; nhân viên / quản lý (booking:cancel_any) hủy được vé của mọi khách
  const b = can(user, 'booking:cancel_any') ? bookingModel.findAny(id) : bookingModel.findOwn(id, user.id);
  if (!b) throw new HttpError(404, 'Không tìm thấy vé.');
  if (b.status !== 'Pending' || isPast(b)) throw new HttpError(409, 'Suất chiếu đã diễn ra, không thể hủy vé.');
  bookingModel.remove(id);
  return { data: { message: 'Đã hủy vé.' } };
};
