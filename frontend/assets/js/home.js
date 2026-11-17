// Trang chủ: banner phim nổi bật, mua vé nhanh, danh sách phim đang chiếu / sắp chiếu
(function () {
  const $ = function (id) { return document.getElementById(id); };
  // Phim có nhiều suất chiếu sắp tới xếp trước; bằng nhau thì theo tên
  const byPopular = function (a, b) { return (b.upcoming - a.upcoming) || a.title.localeCompare(b.title, 'vi'); };
  const E = App.escapeHtml;
  let movies = [], state = 'showing';

  /* ---------- Banner ---------- */
  function renderHero(list) {
    const featured = list.filter(function (m) { return m.state === 'showing'; })
      .sort(function (a, b) { return b.upcoming - a.upcoming; }).slice(0, 4);
    if (featured.length === 0) {
      $('heroSlides').innerHTML = '<div class="carousel-item active"><div class="hero-slide hero-empty"><div class="container"><h1>Chào mừng đến CineManager</h1><p class="lead">Hiện chưa có phim đang chiếu. Hãy quay lại sau nhé!</p></div></div></div>';
      return;
    }
    $('heroSlides').innerHTML = featured.map(function (m, i) {
      return '<div class="carousel-item' + (i === 0 ? ' active' : '') + '"><div class="hero-slide" style="--h:' + hueOf(m.title) + '"><div class="container"><div class="row align-items-center">' +
        '<div class="col-12 col-md-8 col-lg-7 pb-4">' +
          '<div class="mb-2">' + App.ageBadge(m.age_rating).replace('age-badge', 'age-badge position-static d-inline-block') +
          ' <span class="info-pill"><i class="bi bi-tag"></i> ' + E(m.genre) + '</span><span class="info-pill"><i class="bi bi-clock"></i> ' + m.duration_min + ' phút</span></div>' +
          '<h1 class="display-5 mb-3">' + E(m.title) + '</h1><p class="lead mb-4">' + E(m.description || 'Đặt vé ngay để giữ chỗ đẹp nhất.') + '</p>' +
          '<a class="btn btn-cine btn-lg me-2 mb-2" href="movie.html?id=' + m.id + '"><i class="bi bi-ticket-perforated"></i> Mua vé</a>' +
          '<a class="btn btn-outline-light btn-lg mb-2" href="movie.html?id=' + m.id + '">Chi tiết</a></div>' +
        '<div class="col-md-4 col-lg-5 d-none d-md-block"><div class="hero-poster">' + App.posterHtml(m) + '</div></div>' +
      '</div></div></div></div>';
    }).join('');
    $('heroDots').innerHTML = featured.map(function (m, i) {
      return '<button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="' + i + '"' + (i === 0 ? ' class="active" aria-current="true"' : '') + ' aria-label="Phim ' + (i + 1) + '"></button>';
    }).join('');
  }
  function hueOf(str) { let h = 0; String(str).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 360; }); return h; }

  /* ---------- Lưới phim ---------- */
  function renderGrid() {
    const list = movies.filter(function (m) { return m.state === state; }).sort(byPopular);
    $('movieGrid').innerHTML = list.length === 0
      ? '<div class="col-12 empty-state text-center py-5"><i class="bi bi-film display-3"></i><p class="mt-3 mb-0">Chưa có phim ' + (state === 'coming' ? 'sắp chiếu' : 'đang chiếu') + '.</p></div>'
      : list.slice(0, 8).map(App.movieCardHtml).join('');
    $('seeAll').href = 'movies.html' + (state === 'coming' ? '?state=coming' : '');
  }

  /* ---------- Mua vé nhanh: phim -> ngày -> suất ---------- */
  let shows = [];
  function opt(v, t) { return '<option value="' + v + '">' + E(t) + '</option>'; }

  async function onMovie() {
    const id = $('qMovie').value;
    $('qDate').innerHTML = opt('', '-- Chọn ngày --'); $('qShow').innerHTML = opt('', '-- Chọn suất --');
    $('qDate').disabled = true; $('qShow').disabled = true; $('qGo').disabled = true;
    if (!id) return;
    try {
      shows = (await Api.get('/api/showtimes', { movie_id: id, upcoming: 1, sort: 'asc', limit: 50 })).items;
    } catch (e) { App.showError(e); return; }
    const dates = shows.map(function (s) { return s.show_date; }).filter(function (d, i, a) { return a.indexOf(d) === i; });
    if (dates.length === 0) { $('qDate').innerHTML = opt('', 'Chưa có suất chiếu'); return; }
    $('qDate').innerHTML = opt('', '-- Chọn ngày --') + dates.map(function (d) { return opt(d, App.dayLabel(d)); }).join('');
    $('qDate').disabled = false;
  }

  function onDate() {
    const d = $('qDate').value;
    $('qShow').innerHTML = opt('', '-- Chọn suất --'); $('qGo').disabled = true;
    $('qShow').disabled = !d;
    if (!d) return;
    $('qShow').innerHTML = opt('', '-- Chọn suất --') + shows.filter(function (s) { return s.show_date === d; }).map(function (s) {
      const left = s.capacity - s.booked;
      return '<option value="' + s.id + '"' + (left === 0 ? ' disabled' : '') + '>' + s.show_time + ' · ' + s.room_name + (left === 0 ? ' (hết vé)' : '') + '</option>';
    }).join('');
  }

  async function init() {
    await App.init();
    $('qMovie').addEventListener('change', onMovie);
    $('qDate').addEventListener('change', onDate);
    $('qShow').addEventListener('change', function () { $('qGo').disabled = !$('qShow').value; });
    $('quickForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if ($('qShow').value) location.href = 'booking.html?showtime=' + $('qShow').value;
    });
    $('movieTabs').addEventListener('click', function (e) {
      const b = e.target.closest('button[data-state]'); if (!b) return;
      state = b.dataset.state;
      document.querySelectorAll('#movieTabs .nav-link').forEach(function (x) { x.classList.toggle('active', x === b); });
      renderGrid();
    });

    $('movieGrid').innerHTML = App.spinner;
    try {
      movies = (await Api.get('/api/movies', { all: 1 })).items;
    } catch (err) {
      $('heroSlides').innerHTML = '<div class="carousel-item active"><div class="hero-slide hero-empty"><div class="container"><div class="alert alert-danger">' + E(err.message) + '</div></div></div></div>';
      $('movieGrid').innerHTML = '';
      return;
    }
    renderHero(movies);
    renderGrid();
    $('qMovie').innerHTML = opt('', '-- Chọn phim --') + movies.filter(function (m) { return m.state === 'showing' && m.upcoming > 0; })
      .map(function (m) { return opt(m.id, m.title); }).join('');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
