// Phần dùng chung: thanh điều hướng, footer, toast, theme, xử lý form
const App = (function () {
  const THEME_KEY = 'cinema_theme';

  // Vai trò: nhãn hiển thị + màu huy hiệu. Khách vãng lai (chưa đăng nhập) = user null.
  const ROLE = {
    customer: { label: 'Khách hàng', badge: 'text-bg-secondary' },
    staff: { label: 'Nhân viên', badge: 'text-bg-info' },
    manager: { label: 'Quản lý', badge: 'text-bg-danger' }
  };
  // Quyền do server gửi kèm user (user.permissions); server vẫn kiểm tra lại ở mọi API
  function can(user, permission) { return !!(user && user.permissions && user.permissions.indexOf(permission) >= 0); }
  // Trang about.html: khách / khách hàng thấy "Liên hệ"; quản lý thấy "Thống kê"; nhân viên không có trang này
  function aboutLabel(user) { return can(user, 'stats:view') ? 'Thống kê' : can(user, 'contact:create') ? 'Liên hệ' : ''; }
  function roleBadge(user) {
    return user && user.role !== 'customer' && ROLE[user.role] ? ' <span class="badge ' + ROLE[user.role].badge + '">' + ROLE[user.role].label + '</span>' : '';
  }

  const STATUS = {
    Pending: { label: 'Sắp chiếu', badge: 'text-bg-info', icon: 'bi-hourglass-split' },
    Done: { label: 'Đã chiếu', badge: 'text-bg-success', icon: 'bi-check-circle-fill' }
  };

  // Chống chèn HTML (XSS) khi hiển thị dữ liệu người dùng nhập
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatDate(iso) {
    if (!iso || iso.indexOf('-') === -1) return iso || '';
    const p = iso.slice(0, 10).split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function formatMoney(n) {
    return Number(n || 0).toLocaleString('vi-VN') + ' đ';
  }


  /* ---------- Ngày giờ ---------- */
  const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  function parseDate(iso) { const p = iso.slice(0, 10).split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
  function toIso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return toIso(d); }
  function dayLabel(iso) {
    if (iso === todayStr()) return 'Hôm nay';
    if (iso === addDays(1)) return 'Ngày mai';
    return DOW[parseDate(iso).getDay()] + ', ' + formatDate(iso).slice(0, 5);
  }
  // Nút chọn ngày (T2 / 17 / Th11)
  function dateChipHtml(iso, active) {
    const d = parseDate(iso);
    return '<button type="button" class="date-chip' + (active ? ' active' : '') + '" data-date="' + iso + '" aria-pressed="' + !!active + '">' +
      '<span class="dow">' + (iso === todayStr() ? 'Nay' : DOW[d.getDay()]) + '</span><span class="dnum">' + d.getDate() + '</span><span class="mon">Th' + (d.getMonth() + 1) + '</span></button>';
  }

  /* ---------- Poster phim (tự vẽ nếu chưa có ảnh) ---------- */
  const norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'); };
  const ICONS = { 'hanh dong': 'bi-lightning-charge-fill', 'hoat hinh': 'bi-emoji-smile-fill', 'tinh cam': 'bi-heart-fill', 'kinh di': 'bi-moon-stars-fill',
    'hai': 'bi-emoji-laughing-fill', 'tai lieu': 'bi-globe-americas', 'khoa hoc vien tuong': 'bi-rocket-takeoff-fill' };
  function hue(str) { let h = 0; String(str).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 360; }); return h; }
  function ageBadge(age) {
    const a = age || 'T13';
    const tip = { P: 'Phù hợp mọi lứa tuổi', T13: 'Từ 13 tuổi trở lên', T16: 'Từ 16 tuổi trở lên', T18: 'Từ 18 tuổi trở lên' }[a] || '';
    return '<span class="age-badge age-' + escapeHtml(a) + '" title="' + tip + '">' + escapeHtml(a) + '</span>';
  }
  function posterArt(m) {
    return '<div class="poster-art" style="--h:' + hue(m.title) + '"><i class="bi ' + (ICONS[norm(m.genre)] || 'bi-film') + '"></i><span>' + escapeHtml(m.title) + '</span></div>';
  }
  function posterHtml(m, cls) {
    const inner = m.poster_url
      ? '<img src="' + escapeHtml(m.poster_url) + '" alt="Poster phim ' + escapeHtml(m.title) + '" loading="lazy" data-title="' + escapeHtml(m.title) + '" data-genre="' + escapeHtml(m.genre) + '">'
      : posterArt(m);
    return '<div class="poster ' + (cls || '') + '">' + inner + ageBadge(m.age_rating) + '</div>';
  }
  // Ảnh poster lỗi (link hỏng) -> quay về poster tự vẽ. (CSP không cho onerror viết trong HTML nên bắt ở đây)
  document.addEventListener('error', function (e) {
    const img = e.target;
    if (img && img.tagName === 'IMG' && img.closest('.poster')) img.replaceWith(new DOMParser().parseFromString(posterArt({ title: img.dataset.title, genre: img.dataset.genre }), 'text/html').body.firstChild);
  }, true);

  function movieCardHtml(m) {
    const coming = m.state === 'coming';
    return '<div class="col-6 col-md-4 col-lg-3 fade-in"><a class="movie-card" href="movie.html?id=' + m.id + '">' + posterHtml(m) +
      '<div class="movie-meta"><h3 class="movie-title">' + escapeHtml(m.title) + '</h3>' +
      '<div class="small text-body-secondary">' + escapeHtml(m.genre) + ' &middot; ' + m.duration_min + ' phút</div>' +
      (coming ? '<span class="btn btn-sm btn-outline-light w-100 mt-2 disabled-look"><i class="bi bi-calendar-event"></i> Khởi chiếu ' + formatDate(m.release_date).slice(0, 5) + '</span>'
              : '<span class="btn btn-sm btn-cine w-100 mt-2"><i class="bi bi-ticket-perforated"></i> Mua vé</span>') +
      '</div></a></div>';
  }

  /* ---------- Toast ---------- */
  function showToast(message, type) {
    type = type || 'success';
    let box = document.getElementById('toastContainer');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toastContainer';
      box.className = 'toast-container position-fixed top-0 end-0 p-3';
      document.body.appendChild(box);
    }
    const icons = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
    const el = document.createElement('div');
    el.className = 'toast align-items-center text-bg-' + type + ' border-0';
    el.setAttribute('role', 'alert');
    el.innerHTML = '<div class="d-flex"><div class="toast-body"><i class="bi ' + (icons[type] || icons.info) + ' me-2"></i>' +
      escapeHtml(message) + '</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Đóng"></button></div>';
    box.appendChild(el);
    el.addEventListener('hidden.bs.toast', function () { el.remove(); });
    new bootstrap.Toast(el, { delay: 3500 }).show();
  }

  function showError(err) {
    showToast(err && err.message ? err.message : 'Có lỗi xảy ra.', 'danger');
  }

  /* ---------- Theme sáng / tối ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    const icon = document.querySelector('#themeToggle i');
    if (icon) icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
  }

  function bindTheme() {
    applyTheme(document.documentElement.getAttribute('data-bs-theme') || 'light');
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const next = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* bỏ qua */ }
      document.dispatchEvent(new CustomEvent('themechange'));
    });
  }

  /* ---------- Navbar + footer (dùng chung mọi trang) ---------- */
  function navbarHtml(user) {
    const link = function (href, text) { return '<li class="nav-item"><a class="nav-link" href="' + href + '">' + text + '</a></li>'; };
    let right;
    if (user) {
      right =
        '<li class="nav-item dropdown">' +
          '<a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">' +
            '<i class="bi bi-person-circle"></i> ' + escapeHtml(user.full_name) +
            roleBadge(user) + '</a>' +
          '<ul class="dropdown-menu dropdown-menu-end">' +
            (can(user, 'booking:view_own') ? '<li><a class="dropdown-item" href="profile.html#tickets"><i class="bi bi-ticket-perforated"></i> Vé của tôi</a></li>' : '') +
            '<li><a class="dropdown-item" href="profile.html"><i class="bi bi-person-gear"></i> Tài khoản</a></li>' +
            '<li><hr class="dropdown-divider"></li>' +
            '<li><button class="dropdown-item" type="button" id="btnLogout"><i class="bi bi-box-arrow-right"></i> Đăng xuất</button></li>' +
          '</ul></li>';
    } else {
      right = link('login.html', '<i class="bi bi-box-arrow-in-right"></i> Đăng nhập') +
        '<li class="nav-item"><a class="btn btn-sm btn-cine ms-lg-1 my-1 my-lg-0" href="register.html">Đăng ký</a></li>';
    }
    return '<nav class="navbar navbar-expand-lg sticky-top cinema-navbar" data-bs-theme="dark"><div class="container">' +
      '<a class="navbar-brand" href="index.html"><i class="bi bi-film"></i> Cine<span class="text-danger">Manager</span></a>' +
      '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Mở menu"><span class="navbar-toggler-icon"></span></button>' +
      '<div class="collapse navbar-collapse" id="mainNav"><ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">' +
        link('index.html', 'Trang chủ') + link('movies.html', 'Phim') + link('showtimes.html', 'Lịch chiếu') +
        (can(user, 'booking:view_own') ? link('profile.html#tickets', 'Vé của tôi') : '') + (aboutLabel(user) ? link('about.html', aboutLabel(user)) : '') +
        (can(user, 'admin:access') ? link('admin.html', '<i class="bi bi-shield-lock"></i> ' + (user.role === 'manager' ? 'Quản trị' : 'Quầy vé')) : '') +
        right +
        '<li class="nav-item"><button id="themeToggle" class="btn btn-sm btn-outline-light ms-lg-2 mt-2 mt-lg-0" type="button" aria-label="Đổi giao diện sáng/tối"><i class="bi bi-moon-stars-fill"></i></button></li>' +
      '</ul></div></div></nav>';
  }

  function footerHtml(user) {
    return '<footer class="site-footer py-4 mt-auto"><div class="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">' +
      '<div>&copy; ' + new Date().getFullYear() + ' CineManager &middot; Đặt vé xem phim trực tuyến</div>' +
      '<div><a href="index.html">Trang chủ</a> &middot; <a href="movies.html">Phim</a> &middot; <a href="showtimes.html">Lịch chiếu</a>' + (aboutLabel(user) ? ' &middot; <a href="about.html">' + aboutLabel(user) + '</a>' : '') + '</div></div></footer>';
  }

  function highlightNav() {
    let file = location.pathname.split('/').pop() || 'index.html';
    file = { 'movie.html': 'movies.html', 'booking.html': 'showtimes.html' }[file] || file;
    const isTickets = file === 'profile.html' && location.hash === '#tickets';
    document.querySelectorAll('#mainNav .nav-link[href]').forEach(function (a) {
      const href = a.getAttribute('href');
      const on = href === 'profile.html#tickets' ? isTickets : href === file && !(file === 'profile.html' && isTickets);
      if (on) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); }
    });
  }

  /**
   * Khởi tạo trang. opts.require = 'user' (cần đăng nhập); opts.permission = mã quyền cần có (VD 'admin:access')
   * Trả về user hiện tại hoặc null (nếu null và có require thì đã chuyển hướng / chặn).
   */
  async function init(opts) {
    opts = opts || {};
    let user = null;
    try { user = (await Api.get('/api/auth/me')).user; } catch (e) { /* chưa đăng nhập hoặc lỗi mạng */ }

    const nav = document.getElementById('navbar');
    const foot = document.getElementById('footer');
    if (nav) nav.innerHTML = navbarHtml(user);
    if (foot) foot.innerHTML = footerHtml(user);
    bindTheme();
    highlightNav();

    const logout = document.getElementById('btnLogout');
    if (logout) logout.addEventListener('click', async function () {
      try { await Api.post('/api/auth/logout'); } catch (e) { /* bỏ qua */ }
      location.href = 'index.html';
    });

    if (opts.require && !user) {
      location.href = 'login.html?next=' + encodeURIComponent((location.pathname.split('/').pop() || 'index.html') + location.search);
      return null;
    }
    if (opts.permission && !can(user, opts.permission)) {
      const main = document.querySelector('main');
      if (main) main.innerHTML = '<div class="container py-5 text-center"><i class="bi bi-shield-x display-1 text-danger"></i>' +
        '<h1 class="h3 mt-3">403 - Không có quyền truy cập</h1><p class="text-body-secondary">Chỉ nhân viên hoặc quản lý mới được vào trang này.</p>' +
        '<a class="btn btn-cine" href="index.html">Về trang chủ</a></div>';
      return null;
    }
    return user;
  }

  /* ---------- Form: hiển thị lỗi theo từng trường ---------- */
  function setFieldError(form, name, message) {
    const input = form.querySelector('[name="' + name + '"]');
    if (!input) return;
    input.classList.toggle('is-invalid', !!message);
    input.classList.toggle('is-valid', !message && String(input.value).trim() !== '');
    let fb = input.parentElement.querySelector('.invalid-feedback');
    if (!fb) { fb = document.createElement('div'); fb.className = 'invalid-feedback'; input.insertAdjacentElement('afterend', fb); }
    fb.textContent = message || '';
  }

  function clearErrors(form) {
    form.querySelectorAll('.is-invalid, .is-valid').forEach(function (el) { el.classList.remove('is-invalid', 'is-valid'); });
    form.querySelectorAll('.invalid-feedback').forEach(function (el) { el.textContent = ''; });
  }

  function readForm(form) {
    const data = {};
    new FormData(form).forEach(function (v, k) { data[k] = typeof v === 'string' ? v : ''; });
    return data;
  }

  /**
   * Gắn xử lý cho form: validate client -> gọi onSubmit(data) -> hiển thị lỗi server (nếu có).
   * validator(data) trả về { field: message }
   */
  function bindForm(form, validator, onSubmit) {
    const fields = Array.prototype.map.call(form.querySelectorAll('[name]'), function (el) { return el.name; });
    form.setAttribute('novalidate', '');

    // Kiểm tra realtime khi người dùng nhập
    form.addEventListener('input', function (e) {
      if (!e.target.name) return;
      const errors = validator(readForm(form));
      setFieldError(form, e.target.name, errors[e.target.name] || '');
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const data = readForm(form);
      const errors = validator(data);
      fields.forEach(function (f) { setFieldError(form, f, errors[f] || ''); });
      if (Object.keys(errors).length) {
        showToast('Vui lòng kiểm tra lại các trường bị lỗi.', 'danger');
        const bad = form.querySelector('.is-invalid');
        if (bad) bad.focus();
        return;
      }
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        await onSubmit(data);
      } catch (err) {
        if (err.errors) Object.keys(err.errors).forEach(function (f) { setFieldError(form, f, err.errors[f]); });
        showError(err);
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  /* ---------- Hộp thoại xác nhận dùng chung ---------- */
  let confirmModal = null, onYes = null;
  function confirmBox(message, callback) {
    const el = document.getElementById('confirmModal');
    if (!el) { if (window.confirm(message)) callback(); return; }
    if (!confirmModal) {
      confirmModal = new bootstrap.Modal(el);
      document.getElementById('btnConfirmYes').addEventListener('click', function () {
        confirmModal.hide();
        if (typeof onYes === 'function') onYes();
        onYes = null;
      });
    }
    document.getElementById('confirmMessage').textContent = message;
    onYes = callback;
    confirmModal.show();
  }

  // Phân trang Bootstrap (trả về HTML)
  function paginationHtml(page, totalPages) {
    if (totalPages <= 1) return '';
    let html = '<li class="page-item ' + (page === 1 ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (page - 1) + '" aria-label="Trang trước">&laquo;</a></li>';
    for (let i = 1; i <= totalPages; i++) {
      html += '<li class="page-item ' + (i === page ? 'active' : '') + '"><a class="page-link" href="#" data-page="' + i + '">' + i + '</a></li>';
    }
    html += '<li class="page-item ' + (page === totalPages ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (page + 1) + '" aria-label="Trang sau">&raquo;</a></li>';
    return html;
  }

  function debounce(fn, ms) {
    let t;
    return function () { const a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); };
  }

  const spinner = '<div class="col-12 text-center py-5"><div class="spinner-border text-danger" role="status"><span class="visually-hidden">Đang tải...</span></div></div>';

  return {
    DOW: DOW, parseDate: parseDate, addDays: addDays, dayLabel: dayLabel, dateChipHtml: dateChipHtml, norm: norm,
    ageBadge: ageBadge, posterHtml: posterHtml, movieCardHtml: movieCardHtml,
    STATUS: STATUS, ROLE: ROLE, aboutLabel: aboutLabel, can: can, roleBadge: roleBadge, escapeHtml: escapeHtml, todayStr: todayStr, formatDate: formatDate, formatMoney: formatMoney,
    showToast: showToast, showError: showError, init: init,
    setFieldError: setFieldError, clearErrors: clearErrors, readForm: readForm, bindForm: bindForm,
    confirmBox: confirmBox, paginationHtml: paginationHtml, debounce: debounce, spinner: spinner
  };
})();
