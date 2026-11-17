// Kiểm tra dữ liệu phía SERVER (không tin dữ liệu từ client)
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00'));
const isTime = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 120;

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function password(v) {
  const p = typeof v === 'string' ? v : '';
  if (p.length < 6) return 'Mật khẩu tối thiểu 6 ký tự.';
  if (p.length > 72) return 'Mật khẩu tối đa 72 ký tự.';
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Mật khẩu phải có cả chữ và số.';
  return '';
}

function register(b) {
  const e = {};
  const username = str(b.username), email = str(b.email), fullName = str(b.full_name), phone = str(b.phone);
  if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) e.username = 'Tên đăng nhập 3-30 ký tự: chữ, số hoặc dấu gạch dưới.';
  if (!isEmail(email)) e.email = 'Email không hợp lệ.';
  if (fullName.length < 2 || fullName.length > 60) e.full_name = 'Họ tên từ 2 đến 60 ký tự.';
  if (phone && !/^0\d{9,10}$/.test(phone)) e.phone = 'Số điện thoại không hợp lệ (VD: 0912345678).';
  const pe = password(b.password);
  if (pe) e.password = pe;
  return { errors: e, data: { username, email, full_name: fullName, phone, password: b.password } };
}

function profile(b) {
  const e = {};
  const email = str(b.email), fullName = str(b.full_name), phone = str(b.phone);
  if (!isEmail(email)) e.email = 'Email không hợp lệ.';
  if (fullName.length < 2 || fullName.length > 60) e.full_name = 'Họ tên từ 2 đến 60 ký tự.';
  if (phone && !/^0\d{9,10}$/.test(phone)) e.phone = 'Số điện thoại không hợp lệ (VD: 0912345678).';
  return { errors: e, data: { email, full_name: fullName, phone } };
}

const AGES = ['P', 'T13', 'T16', 'T18'];

function validatePoster(poster, errors) {
  if (!poster) return;
  const uploaded = poster.length <= 70000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(poster);
  const link = poster.length <= 300 && /^(https:\/\/|\/)[^\s"'<>]+$/.test(poster);
  if (!uploaded && !link) errors.poster_url = 'Chọn ảnh JPG, PNG hoặc WebP hợp lệ, hoặc nhập link HTTPS.';
}

function movie(b) {
  const e = {};
  const title = str(b.title), genre = str(b.genre), description = str(b.description);
  const duration = Number(b.duration_min);
  const age = str(b.age_rating) || 'T13', release = str(b.release_date), poster = str(b.poster_url);
  if (!title || title.length > 100) e.title = 'Tên phim bắt buộc, tối đa 100 ký tự.';
  if (!genre || genre.length > 40) e.genre = 'Thể loại bắt buộc, tối đa 40 ký tự.';
  if (!Number.isInteger(duration) || duration < 1 || duration > 600) e.duration_min = 'Thời lượng là số nguyên từ 1 đến 600 phút.';
  if (description.length > 500) e.description = 'Mô tả tối đa 500 ký tự.';
  if (!AGES.includes(age)) e.age_rating = 'Độ tuổi phải là P, T13, T16 hoặc T18.';
  if (release && !isDate(release)) e.release_date = 'Ngày khởi chiếu không hợp lệ.';
  validatePoster(poster, e);
  return { errors: e, data: { title, genre, duration_min: duration, description, age_rating: age, release_date: release, poster_url: poster } };
}

function room(b) {
  const e = {};
  const name = str(b.name);
  const capacity = Number(b.capacity);
  if (!name || name.length > 40) e.name = 'Tên phòng bắt buộc, tối đa 40 ký tự.';
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) e.capacity = 'Sức chứa là số nguyên từ 1 đến 1000.';
  return { errors: e, data: { name, capacity } };
}

// original: bản ghi cũ khi SỬA (cho phép giữ nguyên ngày đã qua)
function showtime(b, original) {
  const e = {};
  const movieId = Number(b.movie_id), roomId = Number(b.room_id), price = Number(b.price);
  const date = str(b.show_date), time = str(b.show_time), status = str(b.status) || 'Pending', note = str(b.note);
  if (!Number.isInteger(movieId) || movieId < 1) e.movie_id = 'Vui lòng chọn phim.';
  if (!Number.isInteger(roomId) || roomId < 1) e.room_id = 'Vui lòng chọn phòng chiếu.';
  if (!isDate(date)) e.show_date = 'Ngày chiếu không hợp lệ.';
  else if (date < todayStr() && !(original && original.show_date === date)) e.show_date = 'Ngày chiếu không được nhỏ hơn ngày hiện tại.';
  if (!isTime(time)) e.show_time = 'Giờ chiếu không hợp lệ (HH:MM).';
  if (!Number.isInteger(price) || price < 0 || price > 2000000) e.price = 'Giá vé là số nguyên từ 0 đến 2.000.000 đ.';
  if (!['Pending', 'Done'].includes(status)) e.status = 'Trạng thái không hợp lệ.';
  if (note.length > 200) e.note = 'Ghi chú tối đa 200 ký tự.';
  const poster = b.poster_url === undefined && original ? original.poster_url : str(b.poster_url);
  validatePoster(poster, e);
  return { errors: e, data: { movie_id: movieId, room_id: roomId, show_date: date, show_time: time, price, status, note, poster_url: poster } };
}

function contact(b) {
  const e = {};
  const name = str(b.name), email = str(b.email), message = str(b.message);
  if (name.length < 2 || name.length > 60) e.name = 'Họ tên từ 2 đến 60 ký tự.';
  if (!isEmail(email)) e.email = 'Email không hợp lệ.';
  if (message.length < 10 || message.length > 1000) e.message = 'Nội dung từ 10 đến 1000 ký tự.';
  return { errors: e, data: { name, email, message } };
}

module.exports = { register, profile, password, movie, room, showtime, contact, todayStr, str };
