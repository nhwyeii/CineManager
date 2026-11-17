// Trang Phim: tab đang chiếu / sắp chiếu, lọc thể loại, tìm không dấu
(function () {
  const $ = function (id) { return document.getElementById(id); };
  // Phim có nhiều suất chiếu sắp tới xếp trước; bằng nhau thì theo tên
  const byPopular = function (a, b) { return (b.upcoming - a.upcoming) || a.title.localeCompare(b.title, 'vi'); };
  const q = new URLSearchParams(location.search);
  const f = { state: q.get('state') === 'coming' ? 'coming' : 'showing', genre: '', q: '' };
  let movies = [];

  function render() {
    const kw = App.norm(f.q).trim();
    const list = movies.filter(function (m) {
      return m.state === f.state && (!f.genre || m.genre === f.genre) && (!kw || App.norm(m.title + ' ' + m.genre).includes(kw));
    }).sort(byPopular);
    $('movieCount').textContent = list.length + ' phim ' + (f.state === 'coming' ? 'sắp chiếu' : 'đang chiếu');
    $('movieGrid').innerHTML = list.length === 0
      ? '<div class="col-12 empty-state text-center py-5"><i class="bi bi-film display-3"></i><p class="mt-3 mb-0">Không tìm thấy phim phù hợp.</p></div>'
      : list.map(App.movieCardHtml).join('');
  }

  function setTab() {
    document.querySelectorAll('#movieTabs .nav-link').forEach(function (b) { b.classList.toggle('active', b.dataset.state === f.state); });
  }

  async function init() {
    await App.init();
    setTab();
    $('movieGrid').innerHTML = App.spinner;
    try {
      movies = (await Api.get('/api/movies', { all: 1 })).items;
    } catch (err) {
      $('movieCount').textContent = '';
      $('movieGrid').innerHTML = '<div class="col-12"><div class="alert alert-danger">' + App.escapeHtml(err.message) + '</div></div>';
      return;
    }
    const genres = movies.map(function (m) { return m.genre; }).filter(function (g, i, a) { return a.indexOf(g) === i; }).sort();
    $('genreFilter').innerHTML = '<option value="">Tất cả thể loại</option>' + genres.map(function (g) { return '<option>' + App.escapeHtml(g) + '</option>'; }).join('');
    $('movieTabs').addEventListener('click', function (e) {
      const b = e.target.closest('button[data-state]'); if (!b) return;
      f.state = b.dataset.state; setTab(); render();
    });
    $('genreFilter').addEventListener('change', function (e) { f.genre = e.target.value; render(); });
    $('searchInput').addEventListener('input', App.debounce(function (e) { f.q = e.target.value; render(); }, 200));
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
