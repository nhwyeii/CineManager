// Trang chi tiết phim: thông tin phim + chọn ngày + chọn suất chiếu -> sang trang chọn ghế
(function () {
  const $ = function (id) { return document.getElementById(id); };
  const E = App.escapeHtml;
  let shows = [], date = '';

  function head(m, minPrice) {
    const coming = m.state === 'coming';
    return '<section class="movie-hero" style="--h:' + hueOf(m.title) + '"><div class="container"><div class="row g-4 align-items-center">' +
      '<div class="col-12 col-md-3">' + App.posterHtml(m) + '</div>' +
      '<div class="col-12 col-md-9">' +
        '<h1 class="mb-3">' + E(m.title) + '</h1>' +
        '<div class="mb-3"><span class="info-pill"><i class="bi bi-tag"></i> ' + E(m.genre) + '</span>' +
          '<span class="info-pill"><i class="bi bi-clock"></i> ' + m.duration_min + ' phút</span>' +
          '<span class="info-pill"><i class="bi bi-person-check"></i> ' + ageText(m.age_rating) + '</span>' +
          (m.release_date ? '<span class="info-pill"><i class="bi bi-calendar-event"></i> Khởi chiếu ' + App.formatDate(m.release_date) + '</span>' : '') + '</div>' +
        '<p class="lead mb-4" style="max-width:680px">' + E(m.description || 'Chưa có mô tả cho phim này.') + '</p>' +
        (coming ? '<span class="btn btn-outline-light disabled-look"><i class="bi bi-hourglass-split"></i> Sắp khởi chiếu ' + App.formatDate(m.release_date) + '</span>'
                : '<a href="#showSection" class="btn btn-cine btn-lg"><i class="bi bi-ticket-perforated"></i> Mua vé</a>' +
                  (minPrice != null ? ' <span class="ms-2 small">Giá từ <strong>' + App.formatMoney(minPrice) + '</strong></span>' : '')) +
      '</div></div></div></section>';
  }
  function ageText(a) { return { P: 'P - Mọi lứa tuổi', T13: 'T13 - Từ 13 tuổi', T16: 'T16 - Từ 16 tuổi', T18: 'T18 - Từ 18 tuổi' }[a] || a; }
  function hueOf(str) { let h = 0; String(str).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 360; }); return h; }

  function renderShows() {
    $('dateStrip').querySelectorAll('.date-chip').forEach(function (b) {
      const on = b.dataset.date === date; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
    });
    const day = shows.filter(function (s) { return s.show_date === date; });
    const rooms = day.map(function (s) { return s.room_name; }).filter(function (r, i, a) { return a.indexOf(r) === i; }).sort();
    $('showList').innerHTML = '<p class="small text-body-secondary mb-3">' + App.dayLabel(date) + ' &middot; ' + App.formatDate(date) + '</p>' + rooms.map(function (r) {
      return '<div class="show-row py-3"><div class="fw-semibold mb-2"><i class="bi bi-door-open text-danger"></i> ' + E(r) + '</div><div class="d-flex flex-wrap gap-2">' +
        day.filter(function (s) { return s.room_name === r; }).map(chip).join('') + '</div></div>';
    }).join('');
  }

  function chip(s) {
    const left = s.capacity - s.booked;
    const cls = left === 0 ? ' full' : (left <= s.capacity * 0.2 ? ' few' : '');
    return '<a class="time-chip' + cls + '" href="booking.html?showtime=' + s.id + '" ' + (left === 0 ? 'aria-disabled="true" tabindex="-1"' : '') + '>' +
      '<strong>' + s.show_time + '</strong><small>' + App.formatMoney(s.price) + '</small><small>' + (left === 0 ? 'Hết vé' : 'còn ' + left + ' ghế') + '</small></a>';
  }

  async function init() {
    await App.init();
    const id = Number(new URLSearchParams(location.search).get('id'));
    $('showSection').classList.add('d-none');
    $('movieHead').innerHTML = '<div class="container py-5">' + App.spinner + '</div>';
    let m;
    try { m = (await Api.get('/api/movies/' + (Number.isInteger(id) && id > 0 ? id : 0))).item; }
    catch (err) {
      $('movieHead').innerHTML = '<div class="container py-5 text-center"><i class="bi bi-film display-1 text-danger"></i><h1 class="h3 mt-3">' + E(err.status === 404 ? 'Không tìm thấy phim' : err.message) + '</h1><a class="btn btn-cine mt-2" href="movies.html">Xem danh sách phim</a></div>';
      return;
    }
    document.title = 'CineManager - ' + m.title;
    if (m.state === 'coming') { $('movieHead').innerHTML = head(m, null); return; }
    try { shows = (await Api.get('/api/showtimes', { movie_id: m.id, upcoming: 1, sort: 'asc', limit: 50 })).items; }
    catch (err) { App.showError(err); }
    const minPrice = shows.length ? Math.min.apply(null, shows.map(function (s) { return s.price; })) : null;
    $('movieHead').innerHTML = head(m, minPrice);
    $('showSection').classList.remove('d-none');
    const dates = shows.map(function (s) { return s.show_date; }).filter(function (d, i, a) { return a.indexOf(d) === i; });
    if (dates.length === 0) {
      $('dateStrip').innerHTML = '';
      $('showList').innerHTML = '<div class="empty-state text-center py-4"><i class="bi bi-calendar-x display-4"></i><p class="mt-3 mb-0">Phim này chưa có suất chiếu sắp tới.</p></div>';
      return;
    }
    date = dates[0];
    $('dateStrip').innerHTML = dates.map(function (d) { return App.dateChipHtml(d, d === date); }).join('');
    $('dateStrip').addEventListener('click', function (e) {
      const b = e.target.closest('[data-date]'); if (!b) return;
      date = b.dataset.date; renderShows();
    });
    renderShows();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
