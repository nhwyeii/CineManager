// Controller: liên hệ
const contactModel = require('../models/contactModel');
const v = require('../utils/validate');
const {
  HttpError
} = require('../utils/http');
const {
  validationFail,
  needId,
  hasErrors
} = require('../utils/text');
const hitsByIp = new Map(); // giới hạn 5 lần gửi / phút / IP

exports.create = async ({
  body,
  req
}) => {
  const ip = req.socket.remoteAddress || '';
  const hits = (hitsByIp.get(ip) || []).filter(t => t > Date.now() - 60000);
  if (hits.length >= 5) throw new HttpError(429, 'Bạn gửi quá nhanh, vui lòng thử lại sau ít phút.');
  const {
    errors,
    data
  } = v.contact(body);
  if (hasErrors(errors)) throw validationFail(errors);
  await contactModel.create(data);
  hits.push(Date.now());
  hitsByIp.set(ip, hits);
  return {
    status: 201,
    data: {
      message: 'Cảm ơn ' + data.name + '! Chúng tôi đã nhận được liên hệ của bạn.'
    }
  };
};
exports.list = async () => ({
  data: {
    items: await contactModel.findAll()
  }
});
exports.remove = async ({
  params
}) => {
  if (!(await contactModel.remove(needId(params)))) throw new HttpError(404, 'Không tìm thấy liên hệ.');
  return {
    data: {
      message: 'Đã xóa liên hệ.'
    }
  };
};
