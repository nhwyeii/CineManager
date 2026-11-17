// Trang Lịch chiếu: chọn ngày -> các phim có suất hôm đó (nhóm theo phim) -> chọn suất để đặt ghế
(function () {
  const $ = function (id) { return document.getElementById(id); };
  const E = App.escapeHtml;
  const DAYS = 10;
  const state = { date: App.todayStr(), q: '', room_id: 'all' };

  function chip(s) {
    const left = s.capacity - s.booked;
    const cls = left === 0 ? ' full' : (left <= s.capacity * 0.2 ? ' few' : '');
    return '<a class="time-chip' + cls + '" href="booking.html?showtime=' + s.id + '" ' + (left === 0 ? 'aria-disabled="true" tabindex="-1"' : '') + '>' +
      '<strong>' + s.show_time + '</strong><small>' + E(s.room_name) + '</small><small>' + (left === 0 ? 'Hết vé' : App.formatMoney(s.price)) + '</small></a>';
  }

  function render(items) {
    // Nhóm theo phim, giữ thứ tự giờ chiếu
    const byMovie = {}, order = [];
    items.forEach(function (s) {
      if (!byMovie[s.movie_id]) { byMovie[s.movie_id] = { m: s, list: [] }; order.push(s.movie_id); }
      byMovie[s.movie_id].list.push(s);
    });
    $('showCount').textContent = order.length + ' phim · ' + items.length + ' suất chiếu ngày ' + App.formatDate(state.date);
    if (order.length === 0) {
      $('showList').innerHTML = '<div class="empty-state text-center py-5"><i class="bi bi-calendar-x display-3"></i><p class="mt-3 mb-0">Không có suất chiếu phù hợp trong ngày này.</p></div>';
      return;
    }
    $('showList').innerHTML = order.map(function (id) {
      const g = byMovie[id], s = g.m;
      const poster = { title: s.movie_title, genre: s.genre, age_rating: s.age_rating, poster_url: s.poster_url };
      return '<div class="show-row py-3 d-flex gap-3 fade-in"><a class="mini-poster" href="movie.html?id=' + id + '" aria-label="Chi tiết phim ' + E(s.movie_title) + '">' + App.posterHtml(poster) + '</a>' +
        '<div class="flex-grow-1 min-w-0"><h2 class="h5 mb-1"><a class="text-reset text-decoration-none" href="movie.html?id=' + id + '">' + E(s.movie_title) + '</a></h2>' +
        '<div class="small text-body-secondary mb-2">' + E(s.genre) + ' &middot; ' + s.duration_min + ' phút</div>' +
        '<div class="d-flex flex-wrap gap-2">' + g.list.map(chip).join('') + '</div></div></div>';
    }).join('');
  }

  async function load() {
    $('showList').innerHTML = App.spinner;
    try {
      const res = await Api.get('/api/showtimes', { date: state.date, upcoming: 1, q: state.q, room_id: state.room_id, sort: 'asc', limit: 50 });
      render(res.items);
    } catch (err) {
      $('showList').innerHTML = '<div class="alert alert-danger my-3 d-flex justify-content-between align-items-center"><span>' + E(err.message) + '</span><button class="btn btn-sm btn-outline-danger" id="btnRetry">Thử lại</button></div>';
      $('btnRetry').addEventListener('click', load);
    }
  }

  async function init() {
    await App.init();
    const days = []; for (let i = 0; i < DAYS; i++) days.push(App.addDays(i));
    // Hôm nay hết suất (muộn trong ngày) thì mở sẵn ngày gần nhất còn suất chiếu
    try {
      const first = (await Api.get('/api/showtimes', { upcoming: 1, sort: 'asc', limit: 1 })).items[0];
      if (first && days.indexOf(first.show_date) > -1) state.date = first.show_date;
    } catch (e) { /* giữ ngày hôm nay */ }
    $('dateStrip').innerHTML = days.map(function (d) { return App.dateChipHtml(d, d === state.date); }).join('');
    $('dateStrip').addEventListener('click', function (e) {
      const b = e.target.closest('[data-date]'); if (!b) return;
      state.date = b.dataset.date;
      $('dateStrip').querySelectorAll('.date-chip').forEach(function (x) { const on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on); });
      load();
    });
    $('searchInput').addEventListener('input', App.debounce(function (e) { state.q = e.target.value; load(); }, 300));
    $('filterRoom').addEventListener('change', function (e) { state.room_id = e.target.value; load(); });
    try {
      const rooms = (await Api.get('/api/rooms')).items;
      $('filterRoom').innerHTML = '<option value="all">Tất cả phòng</option>' + rooms.map(function (r) { return '<option value="' + r.id + '">' + E(r.name) + '</option>'; }).join('');
    } catch (err) { /* lọc phòng là phụ, bỏ qua */ }
    load();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
