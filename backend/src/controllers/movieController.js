// Controller: phim
const movieModel = require('../models/movieModel');
const v = require('../utils/validate');
const { HttpError } = require('../utils/http');
const { normalize, paginate, validationFail, dbError, needId, hasErrors } = require('../utils/text');

const DUP = { unique: { 'movies.title': 'Tên phim đã tồn tại.' } };

exports.list = ({ query }) => {
  const kw = normalize(query.q || '').trim();
  let list = movieModel.findAll();
  if (kw) list = list.filter((m) => normalize(m.title + ' ' + m.genre).includes(kw));
  if (query.state === 'showing' || query.state === 'coming') list = list.filter((m) => m.state === query.state);
  if (query.genre) list = list.filter((m) => normalize(m.genre) === normalize(query.genre));
  if (query.all === '1') return { data: { items: list, total: list.length } };
  return { data: paginate(list, query, 8) };
};

exports.detail = ({ params }) => {
  const m = movieModel.findById(needId(params));
  if (!m) throw new HttpError(404, 'Không tìm thấy phim.');
  return { data: { item: m } };
};

exports.create = ({ body }) => {
  const { errors, data } = v.movie(body);
  if (hasErrors(errors)) throw validationFail(errors);
  try {
    const id = movieModel.create(data);
    return { status: 201, data: { message: 'Đã thêm phim.', item: movieModel.findById(id) } };
  } catch (err) { throw dbError(err, DUP); }
};

exports.update = ({ params, body }) => {
  const id = needId(params);
  const current = movieModel.findById(id);
  if (!current) throw new HttpError(404, 'Không tìm thấy phim.');
  const { errors, data } = v.movie({ poster_url: current.poster_url, ...body });
  if (hasErrors(errors)) throw validationFail(errors);
  try { movieModel.update(id, data); } catch (err) { throw dbError(err, DUP); }
  return { data: { message: 'Đã cập nhật phim.' } };
};

exports.remove = ({ params }) => {
  const id = needId(params);
  try {
    if (!movieModel.remove(id)) throw new HttpError(404, 'Không tìm thấy phim.');
  } catch (err) { throw dbError(err, { fk: 'Phim đang có suất chiếu, hãy xóa các suất chiếu trước.' }); }
  return { data: { message: 'Đã xóa phim.' } };
};
