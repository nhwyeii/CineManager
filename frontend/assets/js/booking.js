// Trang chọn ghế: sơ đồ phòng chiếu, chọn tối đa 10 ghế, tính tiền (ghế VIP phụ thu), xác nhận đặt vé
(function () {
  const $ = function (id) { return document.getElementById(id); };
  const E = App.escapeHtml;
  const MAX = 10;
  let user = null, data = null, showId = 0, bookable = true, counterPhone = '', counterName = '';
  const selected = new Set();
  const vipOf = {}; // nhãn ghế -> có phải VIP

  function seatBtn(s, taken) {
    const sel = selected.has(s.label);
    const off = taken.has(s.label) || !bookable;
    return '<button type="button" class="seat' + (s.vip ? ' vip' : '') + (taken.has(s.label) ? ' taken' : '') + (sel ? ' selected' : '') + '" data-seat="' + s.label + '"' +
      (off ? ' disabled' : '') + ' aria-pressed="' + sel + '" aria-label="Ghế ' + s.label + (s.vip ? ' VIP' : ' thường') + (taken.has(s.label) ? ', đã có người đặt' : '') + '">' + s.label.replace(/^[A-Z]+/, '') + '</button>';
  }

  function mapHtml() {
    const taken = new Set(data.taken);
    const half = data.cols >= 8 ? Math.floor(data.cols / 2) : -1; // lối đi ở giữa
    return '<div class="screen">Màn hình</div><div class="seat-map"><div class="seat-map-inner">' + data.rows.map(function (r) {
      return '<div class="seat-row"><span class="row-name">' + r.name + '</span><div class="seats">' + r.seats.map(function (s, i) {
        return (i === half ? '<span class="seat-gap"></span>' : '') + seatBtn(s, taken);
      }).join('') + '</div><span class="row-name">' + r.name + '</span></div>';
    }).join('') + '</div></div>' +
      '<div class="d-flex flex-wrap justify-content-center gap-3 small mt-3">' +
      '<span><span class="legend-seat std"></span>Ghế thường</span><span><span class="legend-seat vip"></span>Ghế VIP (+' + App.formatMoney(data.vip_surcharge) + ')</span>' +
      '<span><span class="legend-seat sel"></span>Đang chọn</span><span><span class="legend-seat tkn"></span>Đã bán</span></div>';
  }

  // Nhân viên / quản lý có quyền bán vé tại quầy
  function counterMode() { return App.can(user, 'booking:sell_counter'); }
  // Bán tại quầy: phải có số điện thoại hợp lệ mới được xác nhận (khách hàng thường không cần)
  function phoneOk() { return !counterMode() || /^0\d{9,10}$/.test(counterPhone.trim()); }

  function price(label) { return data.item.price + (vipOf[label] ? data.vip_surcharge : 0); }
  function sortedSel() { return Array.from(selected).sort(function (a, b) { return a.length - b.length || (a < b ? -1 : a > b ? 1 : 0); }); }

  function summaryHtml() {
    const s = data.item, labels = sortedSel();
    const vipN = labels.filter(function (l) { return vipOf[l]; }).length, stdN = labels.length - vipN;
    const total = labels.reduce(function (t, l) { return t + price(l); }, 0);
    const m = { title: s.movie_title, genre: s.genre, age_rating: s.age_rating, poster_url: s.poster_url };
    return '<div class="card booking-summary"><div class="card-body">' +
      '<div class="d-flex gap-3 mb-3"><a class="mini-poster" href="movie.html?id=' + s.movie_id + '">' + App.posterHtml(m) + '</a><div>' +
        '<h1 class="h5 mb-1">' + E(s.movie_title) + '</h1><div class="small text-body-secondary">' + E(s.genre) + ' &middot; ' + s.duration_min + ' phút</div></div></div>' +
      '<ul class="list-unstyled small mb-3">' +
        '<li><i class="bi bi-calendar-event me-1"></i> <strong>' + App.formatDate(s.show_date) + '</strong> &middot; <strong>' + s.show_time + '</strong></li>' +
        '<li><i class="bi bi-door-open me-1"></i> ' + E(s.room_name) + '</li></ul>' +
      '<div class="mb-2 small text-body-secondary">Ghế đã chọn (' + labels.length + '/' + MAX + ')</div>' +
      '<div class="mb-3" style="min-height:2rem" aria-live="polite">' + (labels.length ? labels.map(function (l) { return '<span class="seat-pill' + (vipOf[l] ? ' vip' : '') + '">' + l + '</span>'; }).join('') : '<span class="text-body-secondary small">Chưa chọn ghế nào.</span>') + '</div>' +
      '<div class="small border-top pt-2">' +
        (stdN ? '<div class="d-flex justify-content-between"><span>Ghế thường × ' + stdN + '</span><span>' + App.formatMoney(stdN * s.price) + '</span></div>' : '') +
        (vipN ? '<div class="d-flex justify-content-between"><span>Ghế VIP × ' + vipN + '</span><span>' + App.formatMoney(vipN * (s.price + data.vip_surcharge)) + '</span></div>' : '') + '</div>' +
      '<div class="d-flex justify-content-between align-items-center border-top mt-2 pt-2 mb-3"><span>Tổng tiền</span><strong class="fs-5 text-danger">' + App.formatMoney(total) + '</strong></div>' +
      (bookable && counterMode() ? '<div class="mb-3"><div class="small fw-semibold mb-2"><i class="bi bi-shop"></i> Bán tại quầy</div>' +
        '<label for="counterPhone" class="form-label small mb-1">Số điện thoại khách hàng <span class="text-danger">*</span></label>' +
        '<input type="tel" id="counterPhone" class="form-control form-control-sm" placeholder="0912345678" value="' + E(counterPhone) + '" autocomplete="off" inputmode="numeric">' +
        '<div class="form-text" id="counterPhoneHelp">Bắt buộc. Khách đã có tài khoản sẽ thấy vé trong &ldquo;Vé của tôi&rdquo;.</div>' +
        '<input type="text" id="counterName" class="form-control form-control-sm mt-2" placeholder="Tên khách (không bắt buộc)" value="' + E(counterName) + '" autocomplete="off"></div>' : '') +
      (!bookable ? '<button class="btn btn-secondary w-100" disabled>Suất chiếu đã kết thúc</button>'
        : '<button type="button" class="btn btn-cine btn-lg w-100" id="btnConfirm"' + (labels.length && phoneOk() ? '' : ' disabled') + '>' +
          (user ? '<i class="bi bi-check2-circle"></i> ' + (counterMode() ? 'Xác nhận bán vé' : 'Xác nhận đặt vé') : '<i class="bi bi-box-arrow-in-right"></i> Đăng nhập để đặt vé') + '</button>') +
      '</div></div>';
  }

  function render() {
    $('bookingRoot').innerHTML = '<div class="row g-4"><div class="col-12 col-lg-8"><div class="card"><div class="card-body py-4" id="mapBox">' +
      (bookable ? '' : '<div class="alert alert-warning">Suất chiếu này đã diễn ra nên không thể đặt vé. <a href="showtimes.html">Chọn suất khác</a></div>') +
      mapHtml() + '</div></div></div><div class="col-12 col-lg-4" id="summaryBox">' + summaryHtml() + '</div></div>';
  }

  function refreshSummary() { $('summaryBox').innerHTML = summaryHtml(); }

  function onSeatClick(e) {
    const b = e.target.closest('button[data-seat]'); if (!b || b.disabled) return;
    const l = b.dataset.seat;
    if (selected.has(l)) selected.delete(l);
    else {
      if (selected.size >= MAX) { App.showToast('Mỗi lần chỉ đặt tối đa ' + MAX + ' ghế.', 'warning'); return; }
      selected.add(l);
    }
    b.classList.toggle('selected', selected.has(l)); b.setAttribute('aria-pressed', selected.has(l));
    refreshSummary();
  }

  async function confirm() {
    if (!user) { location.href = 'login.html?next=' + encodeURIComponent('booking.html?showtime=' + showId); return; }
    const btn = $('btnConfirm'); btn.disabled = true;
    try {
      const payload = { showtime_id: showId, seat_labels: sortedSel() };
      if (counterMode()) { payload.channel = 'counter'; payload.customer_phone = counterPhone.trim(); if (counterName.trim()) payload.customer_name = counterName.trim(); }
      const res = await Api.post('/api/bookings', payload);
      success(res);
    } catch (err) {
      App.showError(err);
      if (err.status === 409 || err.status === 422) { await reload(); } // ghế vừa bị người khác đặt -> tải lại sơ đồ
      else btn.disabled = false;
    }
  }

  function success(res) {
    const s = data.item;
    $('bookingRoot').innerHTML = '<div class="row justify-content-center"><div class="col-12 col-lg-8 text-center fade-in">' +
      '<span class="step-icon bg-success"><i class="bi bi-check-lg"></i></span><h1 class="h3 mt-3">' + (counterMode() ? 'Bán vé thành công!' : 'Đặt vé thành công!') + '</h1>' +
      '<p class="text-body-secondary">Hãy đưa mã vé cho nhân viên khi vào rạp. Bạn có thể xem lại vé trong mục &ldquo;Vé của tôi&rdquo;.</p>' +
      '<div class="ticket text-start my-4"><div class="ticket-main"><div class="mini-poster d-none d-sm-block">' + App.posterHtml({ title: s.movie_title, genre: s.genre, age_rating: s.age_rating, poster_url: s.poster_url }) + '</div><div class="min-w-0">' +
        '<div class="ticket-title mb-1">' + E(s.movie_title) + '</div>' +
        '<div class="small mb-2"><i class="bi bi-calendar-event"></i> ' + App.formatDate(s.show_date) + ' &middot; ' + s.show_time + ' &nbsp; <i class="bi bi-door-open"></i> ' + E(s.room_name) + '</div>' +
        '<div class="mb-2">' + res.seat_labels.map(function (l) { return '<span class="seat-pill' + (vipOf[l] ? ' vip' : '') + '">' + l + '</span>'; }).join('') + '</div>' +
        '<div class="small text-body-secondary">Tổng tiền: <strong class="text-body">' + App.formatMoney(res.total_price) + '</strong></div></div></div>' +
        '<div class="ticket-stub"><div class="small text-body-secondary">Mã vé</div><div class="ticket-code">' + E(res.code) + '</div><div class="barcode"></div></div></div>' +
      (counterMode() ? '<a class="btn btn-cine me-2" href="admin.html"><i class="bi bi-list-check"></i> Danh sách vé</a>' : '<a class="btn btn-cine me-2" href="profile.html#tickets"><i class="bi bi-ticket-perforated"></i> Xem vé của tôi</a>') + '<a class="btn btn-outline-light" href="index.html">Về trang chủ</a></div></div>';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function reload() {
    data = await Api.get('/api/showtimes/' + showId + '/seats');
    const taken = new Set(data.taken);
    Array.from(selected).forEach(function (l) { if (taken.has(l)) selected.delete(l); });
    data.rows.forEach(function (r) { r.seats.forEach(function (s) { vipOf[s.label] = s.vip; }); });
    const s = data.item;
    bookable = s.status === 'Pending' && new Date(s.show_date + 'T' + s.show_time + ':00') > new Date();
    render();
  }

  async function init() {
    user = await App.init();
    showId = Number(new URLSearchParams(location.search).get('showtime'));
    try {
      if (!Number.isInteger(showId) || showId < 1) throw new ApiError(404, 'Không tìm thấy suất chiếu.');
      await reload();
    } catch (err) {
      $('bookingRoot').innerHTML = '<div class="text-center py-5"><i class="bi bi-calendar-x display-1 text-danger"></i><h1 class="h3 mt-3">' + E(err.message) + '</h1><a class="btn btn-cine mt-2" href="showtimes.html">Xem lịch chiếu</a></div>';
      return;
    }
    document.title = 'CineManager - Chọn ghế: ' + data.item.movie_title;
    $('bookingRoot').addEventListener('input', function (e) {
      if (e.target.id === 'counterName') counterName = e.target.value;
      if (e.target.id !== 'counterPhone') return;
      counterPhone = e.target.value;
      const ok = /^0\d{9,10}$/.test(counterPhone.trim());
      e.target.classList.toggle('is-invalid', counterPhone.trim() !== '' && !ok);
      e.target.classList.toggle('is-valid', ok);
      const btn = $('btnConfirm'); if (btn) btn.disabled = !(ok && selected.size > 0);
    });
    $('bookingRoot').addEventListener('click', function (e) {
      if (e.target.closest('#btnConfirm')) confirm(); else onSeatClick(e);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
