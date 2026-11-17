// Kiểm tra dữ liệu phía CLIENT (server vẫn kiểm tra lại một lần nữa)
const Validation = (function () {
  const isEmail = function (s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); };
  const t = function (v) { return String(v == null ? '' : v).trim(); };

  function passwordError(p) {
    p = String(p || '');
    if (p.length < 6) return 'Mật khẩu tối thiểu 6 ký tự.';
    if (p.length > 72) return 'Mật khẩu tối đa 72 ký tự.';
    if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Mật khẩu phải có cả chữ và số.';
    return '';
  }

  const rules = {
    login: function (d) {
      const e = {};
      if (!t(d.username)) e.username = 'Vui lòng nhập tên đăng nhập hoặc email.';
      if (!d.password) e.password = 'Vui lòng nhập mật khẩu.';
      return e;
    },
    register: function (d) {
      const e = {};
      if (!/^[A-Za-z0-9_]{3,30}$/.test(t(d.username))) e.username = 'Tên đăng nhập 3-30 ký tự: chữ, số hoặc dấu gạch dưới.';
      if (!isEmail(t(d.email))) e.email = 'Email không hợp lệ.';
      if (t(d.full_name).length < 2 || t(d.full_name).length > 60) e.full_name = 'Họ tên từ 2 đến 60 ký tự.';
      if (t(d.phone) && !/^0\d{9,10}$/.test(t(d.phone))) e.phone = 'Số điện thoại không hợp lệ (VD: 0912345678).';
      const pe = passwordError(d.password);
      if (pe) e.password = pe;
      if (d.confirm !== d.password) e.confirm = 'Mật khẩu nhập lại không khớp.';
      return e;
    },
    profile: function (d) {
      const e = {};
      if (!isEmail(t(d.email))) e.email = 'Email không hợp lệ.';
      if (t(d.full_name).length < 2 || t(d.full_name).length > 60) e.full_name = 'Họ tên từ 2 đến 60 ký tự.';
      if (t(d.phone) && !/^0\d{9,10}$/.test(t(d.phone))) e.phone = 'Số điện thoại không hợp lệ (VD: 0912345678).';
      return e;
    },
    password: function (d) {
      const e = {};
      if (!d.current_password) e.current_password = 'Vui lòng nhập mật khẩu hiện tại.';
      const pe = passwordError(d.new_password);
      if (pe) e.new_password = pe;
      if (d.confirm !== d.new_password) e.confirm = 'Mật khẩu nhập lại không khớp.';
      return e;
    },
    showtime: function (d, original) {
      const e = {};
      if (!d.movie_id) e.movie_id = 'Vui lòng chọn phim.';
      if (!d.room_id) e.room_id = 'Vui lòng chọn phòng chiếu.';
      if (!d.show_date) e.show_date = 'Vui lòng chọn ngày chiếu.';
      else if (d.show_date < App.todayStr() && !(original && original === d.show_date)) e.show_date = 'Ngày chiếu không được nhỏ hơn ngày hiện tại.';
      if (!d.show_time) e.show_time = 'Vui lòng chọn giờ chiếu.';
      const price = Number(d.price);
      if (d.price === '' || !Number.isInteger(price) || price < 0 || price > 2000000) e.price = 'Giá vé là số nguyên từ 0 đến 2.000.000 đ.';
      if (t(d.note).length > 200) e.note = 'Ghi chú tối đa 200 ký tự.';
      return e;
    },
    movie: function (d) {
      const e = {};
      if (!t(d.title) || t(d.title).length > 100) e.title = 'Tên phim bắt buộc, tối đa 100 ký tự.';
      if (!t(d.genre) || t(d.genre).length > 40) e.genre = 'Thể loại bắt buộc, tối đa 40 ký tự.';
      const n = Number(d.duration_min);
      if (d.duration_min === '' || !Number.isInteger(n) || n < 1 || n > 600) e.duration_min = 'Thời lượng là số nguyên từ 1 đến 600 phút.';
      if (t(d.description).length > 500) e.description = 'Mô tả tối đa 500 ký tự.';
      if (['P', 'T13', 'T16', 'T18'].indexOf(d.age_rating) === -1) e.age_rating = 'Chọn độ tuổi phù hợp.';
      if (t(d.poster_url) && !/^data:image\//.test(t(d.poster_url)) && !/^(https:\/\/|\/)[^\s"'<>]+$/.test(t(d.poster_url))) e.poster_url = 'Link poster phải bắt đầu bằng https://';
      return e;
    },
    room: function (d) {
      const e = {};
      if (!t(d.name) || t(d.name).length > 40) e.name = 'Tên phòng bắt buộc, tối đa 40 ký tự.';
      const n = Number(d.capacity);
      if (d.capacity === '' || !Number.isInteger(n) || n < 1 || n > 1000) e.capacity = 'Sức chứa là số nguyên từ 1 đến 1000.';
      return e;
    },
    contact: function (d) {
      const e = {};
      if (t(d.name).length < 2 || t(d.name).length > 60) e.name = 'Họ tên từ 2 đến 60 ký tự.';
      if (!isEmail(t(d.email))) e.email = 'Email không hợp lệ.';
      if (t(d.message).length < 10 || t(d.message).length > 1000) e.message = 'Nội dung từ 10 đến 1000 ký tự (hiện có ' + t(d.message).length + ').';
      return e;
    },
    booking: function (d) {
      const e = {};
      const n = Number(d.seats);
      if (!Number.isInteger(n) || n < 1 || n > 10) e.seats = 'Số vé là số nguyên từ 1 đến 10.';
      return e;
    }
  };

  return { rules: rules };
})();
