// Controller: phòng chiếu
const roomModel = require('../models/roomModel');
const v = require('../utils/validate');
const seats = require('../utils/seats');
const {
  HttpError
} = require('../utils/http');
const {
  validationFail,
  dbError,
  needId,
  hasErrors
} = require('../utils/text');
const DUP = {
  unique: {
    'rooms.name': 'Tên phòng đã tồn tại.'
  }
};
exports.list = async () => ({
  data: {
    items: await roomModel.findAll()
  }
});
exports.create = async ({
  body
}) => {
  const {
    errors,
    data
  } = v.room(body);
  if (hasErrors(errors)) throw validationFail(errors);
  try {
    const id = await roomModel.create(data);
    return {
      status: 201,
      data: {
        message: 'Đã thêm phòng chiếu.',
        item: await roomModel.findById(id)
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
  if (!(await roomModel.findById(id))) throw new HttpError(404, 'Không tìm thấy phòng.');
  const {
    errors,
    data
  } = v.room(body);
  if (hasErrors(errors)) throw validationFail(errors);
  // Không cho giảm sức chứa xuống thấp hơn số ghế đã đặt của một suất chiếu
  const maxBooked = await roomModel.maxBookedSeats(id);
  if (data.capacity < maxBooked) throw new HttpError(409, 'Sức chứa không được nhỏ hơn số ghế đã đặt (' + maxBooked + ').', {
    capacity: 'Tối thiểu ' + maxBooked + ' (đã có vé đặt).'
  });
  // Sơ đồ ghế sinh từ sức chứa: không đổi sơ đồ nếu phòng đã có ghế được bán
  const old = await roomModel.findById(id);
  const sold = await roomModel.bookedLabels(id);
  if (sold.length && data.capacity !== old.capacity) {
    const valid = new Set(seats.flat(data.capacity).map(x => x.label));
    if (seats.layout(old.capacity).cols !== seats.layout(data.capacity).cols || sold.some(l => !valid.has(l))) throw new HttpError(409, 'Phòng đã có ghế được bán, không thể đổi sức chứa làm thay đổi sơ đồ ghế.', {
      capacity: 'Phòng đã có vé đặt, sơ đồ ghế không đổi được.'
    });
  }
  try {
    await roomModel.update(id, data);
  } catch (err) {
    throw dbError(err, DUP);
  }
  return {
    data: {
      message: 'Đã cập nhật phòng chiếu.'
    }
  };
};
exports.remove = async ({
  params
}) => {
  const id = needId(params);
  try {
    if (!(await roomModel.remove(id))) throw new HttpError(404, 'Không tìm thấy phòng.');
  } catch (err) {
    throw dbError(err, {
      fk: 'Phòng đang có suất chiếu, hãy xóa các suất chiếu trước.'
    });
  }
  return {
    data: {
      message: 'Đã xóa phòng chiếu.'
    }
  };
};
