// Trang tài khoản: vé của tôi (vé điện tử có ghế), sửa thông tin, đổi mật khẩu
(function () {
  const $ = function (id) { return document.getElementById(id); };

  let tickets = [], tab = 'upcoming';
  const E = App.escapeHtml;
  const isPast = function (b) { return b.status !== 'Pending' || new Date(b.show_date + 'T' + b.show_time + ':00') < new Date(); };

  function ticketHtml(b) {
    const past = isPast(b);
    const poster = { title: b.movie_title, genre: b.genre, age_rating: b.age_rating, poster_url: b.poster_url };
    return '<div class="col-12 col-xl-6 fade-in"><div class="ticket h-100' + (past ? ' is-past' : '') + '"><div class="ticket-main">' +
      '<div class="mini-poster">' + App.posterHtml(poster) + '</div><div class="min-w-0">' +
        '<div class="ticket-title mb-1">' + E(b.movie_title) + '</div>' +
        '<div class="small mb-1"><i class="bi bi-calendar-event"></i> <strong>' + App.formatDate(b.show_date) + '</strong> &middot; <strong>' + b.show_time + '</strong></div>' +
        '<div class="small mb-2"><i class="bi bi-door-open"></i> ' + E(b.room_name) + '</div>' +
        '<div class="mb-2">' + b.seat_labels.map(function (l) { return '<span class="seat-pill">' + E(l) + '</span>'; }).join('') + '</div>' +
        '<div class="small text-body-secondary">' + b.seats + ' vé &middot; ' + App.formatMoney(b.total_price) + '</div></div></div>' +
      '<div class="ticket-stub"><div class="small text-body-secondary">Mã vé</div><div class="ticket-code">' + E(b.code) + '</div><div class="barcode"></div>' +
        (past ? '<span class="badge text-bg-secondary">Đã chiếu</span>'
              : '<button class="btn btn-sm btn-outline-danger mt-1" data-cancel="' + b.id + '"><i class="bi bi-x-circle"></i> Hủy vé</button>') +
      '</div></div></div>';
  }

  function renderTickets() {
    const box = $('ticketList');
    const list = tickets.filter(function (b) { return (tab === 'past') === isPast(b); });
    if (tab === 'upcoming') list.reverse(); // vé sắp tới: suất gần nhất lên đầu
    box.innerHTML = list.length === 0
      ? '<div class="col-12"><div class="empty-state text-center py-4"><i class="bi bi-ticket-perforated display-3"></i><p class="mt-3 mb-0">' +
        (tab === 'past' ? 'Bạn chưa xem phim nào.' : 'Bạn chưa có vé nào sắp xem.') + ' <a href="showtimes.html">Đặt vé ngay</a></p></div></div>'
      : list.map(ticketHtml).join('');
  }

  async function loadBookings() {
    const box = $('ticketList');
    try {
      tickets = (await Api.get('/api/bookings/mine')).items;
      // Còn vé sắp xem thì mở tab đó, không thì mở tab đã xem
      if (!tickets.some(function (b) { return !isPast(b); }) && tickets.length) tab = 'past';
      document.querySelectorAll('#ticketTabs .nav-link').forEach(function (x) { x.classList.toggle('active', x.dataset.tab === tab); });
      renderTickets();
    } catch (err) {
      box.innerHTML = '<div class="col-12"><div class="alert alert-danger mb-0">' + E(err.message) + '</div></div>';
    }
  }

  async function init() {
    const user = await App.init({ require: 'user' });
    if (!user) return;

    $('pUsername').textContent = user.username;
    $('pRole').textContent = (App.ROLE[user.role] || { label: user.role }).label;
    const pf = $('profileForm');
    pf.full_name.value = user.full_name; pf.email.value = user.email; pf.phone.value = user.phone || '';

    App.bindForm(pf, Validation.rules.profile, async function (data) {
      const res = await Api.put('/api/auth/me', data);
      App.showToast(res.message);
      $('navbar').querySelector('.dropdown-toggle').innerHTML = '<i class="bi bi-person-circle"></i> ' + App.escapeHtml(res.user.full_name) +
        App.roleBadge(res.user);
    });

    const pw = $('passwordForm');
    App.bindForm(pw, Validation.rules.password, async function (data) {
      const res = await Api.put('/api/auth/password', { current_password: data.current_password, new_password: data.new_password });
      App.showToast(res.message);
      pw.reset();
      App.clearErrors(pw);
    });

    $('ticketTabs').addEventListener('click', function (e) {
      const b = e.target.closest('button[data-tab]'); if (!b) return;
      tab = b.dataset.tab;
      document.querySelectorAll('#ticketTabs .nav-link').forEach(function (x) { x.classList.toggle('active', x === b); });
      renderTickets();
    });
    $('ticketList').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-cancel]');
      if (!btn) return;
      App.confirmBox('Bạn có chắc muốn hủy vé này? Ghế sẽ được trả lại cho người khác.', function () {
        Api.del('/api/bookings/' + btn.dataset.cancel).then(function (r) { App.showToast(r.message, 'warning'); loadBookings(); }).catch(App.showError);
      });
    });
    if (App.can(user, 'booking:view_own')) loadBookings();
    else { const sec = $('tickets'); if (sec) sec.remove(); }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
