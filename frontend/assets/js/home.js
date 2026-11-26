// Trang chủ: hiển thị danh sách phim.
(function () {
  const $ = function (id) {
    return document.getElementById(id);
  };

  const E = App.escapeHtml;

  let movies = [];
  let state = 'showing';

  function renderGrid() {
    const list = movies
      .filter(function (movie) {
        return movie.state === state;
      })
      .sort(function (a, b) {
        return (b.upcoming - a.upcoming) ||
          a.title.localeCompare(b.title, 'vi');
      });

    $('movieGrid').innerHTML = list.length
      ? list.slice(0, 8).map(App.movieCardHtml).join('')
      : '<div class="col-12 text-center py-4">' +
          'Chưa có phim ' +
          (state === 'coming' ? 'sắp chiếu' : 'đang chiếu') +
          '.' +
        '</div>';

    $('seeAll').href =
      'movies.html' + (state === 'coming' ? '?state=coming' : '');
  }

  async function init() {
    $('movieGrid').innerHTML = App.spinner;

    $('movieTabs').addEventListener('click', function (event) {
      const button = event.target.closest('button[data-state]');
      if (!button) return;

      state = button.dataset.state;

      document.querySelectorAll('#movieTabs .nav-link')
        .forEach(function (item) {
          item.classList.toggle('active', item === button);
        });

      renderGrid();
    });

    try {
      await App.init();

      const result = await Api.get('/api/movies', { all: 1 });
      movies = result.items || [];

      renderGrid();
    } catch (err) {
      $('movieGrid').innerHTML =
        '<div class="col-12">' +
          '<div class="alert alert-danger">' +
            E(err.message) +
          '</div>' +
        '</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();