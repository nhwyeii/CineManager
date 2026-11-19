// Controller: suất chiếu (tìm kiếm, lọc, sắp xếp, phân trang + CRUD cho Admin)
const showtimeModel = require('../models/showtimeModel');
const movieModel = require('../models/movieModel');
const roomModel = require('../models/roomModel');
const v = require('../utils/validate');
const {
  HttpError
} = require('../utils/http');
const seats = require('../utils/seats');
const {
  normalize,
  paginate,
  validationFail,
  dbError,
  needId,
  hasErrors
} = require('../utils/text');
const DUP = {
  unique: {
    'showtimes.room_id': 'Phòng này đã có suất chiếu vào đúng ngày và giờ đó.'
  }
};
async function checkRefs(data) {
  const errors = {};
  if (!(await movieModel.findById(data.movie_id))) errors.movie_id = 'Phim không tồn tại.';
  if (!(await roomModel.findById(data.room_id))) errors.room_id = 'Phòng chiếu không tồn tại.';
  return errors;
}
exports.list = async ({
  query
}) => {
  let list = await showtimeModel.findAll();
  const kw = normalize(query.q || '').trim();
  if (kw) list = list.filter(s => normalize(s.movie_title + ' ' + s.genre + ' ' + s.note + ' ' + s.room_name).includes(kw));
  if (query.status === 'Pending' || query.status === 'Done') list = list.filter(s => s.status === query.status);
  if (query.room_id) list = list.filter(s => String(s.room_id) === String(query.room_id));
  if (query.date) list = list.filter(s => s.show_date === query.date);
  // upcoming=1: chỉ suất chưa bắt đầu (dùng cho trang bán vé)
  if (query.upcoming === '1') {
    const now = Date.now();
    list = list.filter(s => s.status === 'Pending' && new Date(s.show_date + 'T' + s.show_time + ':00').getTime() >= now);
  }
  if (query.movie_id) list = list.filter(s => String(s.movie_id) === String(query.movie_id));
  const dir = query.sort === 'desc' ? -1 : 1;
  list.sort((a, b) => dir * (a.show_date + a.show_time).localeCompare(b.show_date + b.show_time));
  const result = paginate(list, query, 6);
  if (query.focus_id) {
    const index = list.findIndex(s => String(s.id) === query.focus_id);
    if (index >= 0) {
      const page = Math.floor(index / result.limit) + 1;
      if (page !== result.page) return {
        data: paginate(list, {
          ...query,
          page
        }, 6)
      };
    }
  }
  return {
    data: result
  };
};
exports.detail = async ({
  params
}) => {
  const s = await showtimeModel.findById(needId(params));
  if (!s) throw new HttpError(404, 'Không tìm thấy suất chiếu.');
  return {
    data: {
      item: s
    }
  };
};

// Sơ đồ ghế của một suất chiếu + ghế đã bán
exports.seatMap = async ({
  params
}) => {
  const s = await showtimeModel.findById(needId(params));
  if (!s) throw new HttpError(404, 'Không tìm thấy suất chiếu.');
  const lay = seats.layout(s.capacity);
  return {
    data: {
      item: s,
      cols: lay.cols,
      rows: lay.rows,
      taken: await showtimeModel.takenSeats(s.id),
      vip_surcharge: seats.vipSurcharge(s.price)
    }
  };
};
exports.create = async ({
  body
}) => {
  const {
    errors,
    data
  } = v.showtime(body);
  if (!hasErrors(errors)) Object.assign(errors, await checkRefs(data));
  if (hasErrors(errors)) throw validationFail(errors);
  try {
    const id = await showtimeModel.create(data);
    return {
      status: 201,
      data: {
        message: 'Đã thêm suất chiếu mới.',
        item: await showtimeModel.findById(id)
      }
    };
  } catch (err) {
    throw dbError(err, DUP);
  }
};
exports.update = async ({
  params,
  body
}) => {
  const id = needId(params);
  const old = await showtimeModel.findRaw(id);
  if (!old) throw new HttpError(404, 'Không tìm thấy suất chiếu.');
  const {
    errors,
    data
  } = v.showtime(body, old);
  if (!hasErrors(errors)) Object.assign(errors, await checkRefs(data));
  if (hasErrors(errors)) throw validationFail(errors);
  const booked = await showtimeModel.bookedSeats(id);
  if (booked > 0 && data.room_id !== old.room_id) throw new HttpError(409, 'Suất chiếu đã có vé đặt, không thể đổi sang phòng khác (ghế đã chọn sẽ không còn khớp).', {
    room_id: 'Không đổi phòng được khi đã có vé.'
  });
  if (booked > (await roomModel.findById(data.room_id)).capacity) throw new HttpError(409, 'Phòng mới có sức chứa nhỏ hơn số vé đã đặt (' + booked + ').', {
    room_id: 'Phòng quá nhỏ so với số vé đã đặt.'
  });
  try {
    await showtimeModel.update(id, data);
  } catch (err) {
    throw dbError(err, DUP);
  }
  return {
    data: {
      message: 'Đã cập nhật suất chiếu #' + id + '.',
      item: await showtimeModel.findById(id)
    }
  };
};
exports.remove = async ({
  params
}) => {
  const id = needId(params);
  try {
    if (!(await showtimeModel.remove(id))) throw new HttpError(404, 'Không tìm thấy suất chiếu.');
  } catch (err) {
    throw dbError(err, {
      fk: 'Suất chiếu đã có vé đặt, không thể xóa.'
    });
  }
  return {
    data: {
      message: 'Đã xóa suất chiếu.'
    }
  };
};
