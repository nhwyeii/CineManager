// Trang Thống kê (dữ liệu tổng hợp từ server) + form liên hệ
(function () {
  const $ = function (id) { return document.getElementById(id); };
  let charts = [];
  let stats = null;

  function bars(boxId, rows, color) {
    const max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));
    $(boxId).innerHTML = rows.length === 0 ? '<p class="text-body-secondary mb-0">Chưa có dữ liệu.</p>' : rows.map(function (r) {
      return '<div class="mb-3"><div class="d-flex justify-content-between small mb-1"><span>' + App.escapeHtml(r.label) + '</span><span>' + r.value + '</span></div>' +
        '<div class="progress" role="progressbar" aria-label="' + App.escapeHtml(r.label) + '" aria-valuenow="' + r.value + '" aria-valuemin="0" aria-valuemax="' + max + '">' +
        '<div class="progress-bar ' + color + '" style="width:' + Math.round(r.value / max * 100) + '%"></div></div></div>';
    }).join('');
  }

  function renderNumbers(s) {
    $('statTotal').textContent = s.total;
    $('statPending').textContent = s.pending;
    $('statDone').textContent = s.done;
    $('statTickets').textContent = s.tickets;
    $('statMovies').textContent = s.movies;
    if (s.revenue !== undefined) {
      $('revenueCol').classList.remove('d-none');
      $('statRevenue').textContent = App.formatMoney(s.revenue);
    }
    const percent = s.total === 0 ? 0 : Math.round(s.done / s.total * 100);
    const bar = $('statProgress');
    bar.style.width = percent + '%';
    bar.textContent = percent + '%';
    bars('roomBars', s.byRoom, 'bg-danger');
    bars('topBars', s.topMovies, 'bg-success');
  }

  function renderCharts(s) {
    if (typeof Chart === 'undefined') return; // không tải được Chart.js -> vẫn có thanh tiến độ ở trên
    charts.forEach(function (c) { c.destroy(); });
    const text = getComputedStyle(document.body).color;
    charts = [
      new Chart($('chartStatus'), {
        type: 'doughnut',
        data: { labels: ['Sắp chiếu', 'Đã chiếu'], datasets: [{ data: [s.pending, s.done], backgroundColor: ['#0dcaf0', '#198754'] }] },
        options: { plugins: { legend: { position: 'bottom', labels: { color: text } } } }
      }),
      new Chart($('chartGenre'), {
        type: 'bar',
        data: { labels: s.byGenre.map(function (r) { return r.label; }), datasets: [{ label: 'Số suất chiếu', data: s.byGenre.map(function (r) { return r.value; }), backgroundColor: '#ac3022' }] },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: text } }, x: { ticks: { color: text } } } }
      })
    ];
  }

  async function loadStats() {
    try {
      stats = await Api.get('/api/stats');
      renderNumbers(stats);
      renderCharts(stats);
    } catch (err) { App.showError(err); }
  }

  async function init() {
    const user = await App.init();
    const canStats = App.can(user, 'stats:view'), canContact = App.can(user, 'contact:create');
    const h = document.querySelector('.page-header h1'), sub = document.querySelector('.page-header p');
    if (!canStats && !canContact) { // nhân viên: không có trang này
      const main = document.querySelector('main');
      main.innerHTML = '<div class="container py-5 text-center"><i class="bi bi-shield-x display-1 text-danger"></i><h1 class="h3 mt-3">403 - Không có quyền truy cập</h1>' +
        '<p class="text-body-secondary">Trang này dành cho khách hàng (liên hệ) và quản lý (thống kê).</p><a class="btn btn-cine" href="admin.html">Về trang quầy vé</a></div>';
      return;
    }
    if (canStats) { // Quản lý: chỉ có thống kê, không có form liên hệ
      document.title = 'CineManager - Thống kê';
      h.innerHTML = '<i class="bi bi-bar-chart-line text-danger"></i> Thống kê';
      sub.textContent = 'Tổng hợp dữ liệu từ cơ sở dữ liệu (chỉ dành cho Quản lý).';
      $('statsSection').classList.remove('d-none');
      document.addEventListener('themechange', function () { if (stats) renderCharts(stats); });
      loadStats();
    } else { // Khách / khách hàng: chỉ có form liên hệ
      document.title = 'CineManager - Liên hệ';
      h.innerHTML = '<i class="bi bi-envelope text-danger"></i> Liên hệ';
      sub.textContent = 'Gửi góp ý cho rạp.';
      $('contactSection').classList.remove('d-none');
      const form = $('contactForm');
      if (user) { form.name.value = user.full_name; form.email.value = user.email; }
      App.bindForm(form, Validation.rules.contact, async function (data) {
        const res = await Api.post('/api/contact', data);
        App.showToast(res.message);
        form.reset();
        App.clearErrors(form);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
