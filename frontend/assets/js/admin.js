// Trang quản trị (nhân viên + quản lý): tab nào hiện ra phụ thuộc quyền của vai trò (me.permissions)
// Nhân viên: Suất chiếu (thêm/sửa), Vé (xem/hủy), Liên hệ (xem). Quản lý: thêm Phim, Phòng, Người dùng, quyền xóa, doanh thu.
(function () {
  const $ = function (id) { return document.getElementById(id); };
  const E = App.escapeHtml;
  let me = null;

  const err = function (box, cols, e) {
    box.innerHTML = '<tr><td colspan="' + cols + '"><div class="alert alert-danger mb-0">' + E(e.message) + '</div></td></tr>';
  };
  const empty = function (cols, text) { return '<tr><td colspan="' + cols + '" class="text-center text-body-secondary py-4">' + text + '</td></tr>'; };

  /* ================= PHIM ================= */
  const movieState = { q: '', page: 1 };
  let movieList = [], movieModal, editingMovie = null, moviePoster;

  async function loadMovies() {
    const body = $('movieBody');
    body.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border spinner-border-sm text-danger"></div></td></tr>';
    try {
      const res = await Api.get('/api/movies', { q: movieState.q, page: movieState.page, limit: 6 });
      movieList = res.items;
      movieState.page = res.page;
      body.innerHTML = res.items.length === 0
        ? empty(6, movieState.q ? 'Không tìm thấy phim phù hợp.' : 'Chưa có phim nào.')
        : res.items.map(function (m) {
          return '<tr><td class="text-nowrap">' + (m.poster_url ? '<img class="admin-thumb" alt="" src="' + E(m.poster_url) + '">' : '') + E(m.title) + (m.state === 'coming' ? ' <span class="badge text-bg-info">Sắp chiếu</span>' : '') + '</td><td>' + E(m.genre) + '</td><td>' + App.ageBadge(m.age_rating).replace('age-badge', 'age-badge position-static d-inline-block') + '</td><td class="text-end">' + m.duration_min + '</td>' +
            '<td class="d-none d-md-table-cell small text-body-secondary">' + (m.release_date ? App.formatDate(m.release_date) : '—') + '</td>' +
            '<td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-primary" data-edit="' + m.id + '" aria-label="Sửa phim"><i class="bi bi-pencil-square"></i></button> ' +
            '<button class="btn btn-sm btn-outline-danger" data-del="' + m.id + '" aria-label="Xóa phim"><i class="bi bi-trash3"></i></button></td></tr>';
        }).join('');
      $('moviePagination').innerHTML = App.paginationHtml(res.page, res.totalPages);
    } catch (e) { err(body, 6, e); }
  }

  /* --- Ảnh minh họa: chọn từ máy -> thu nhỏ bằng canvas -> lưu dạng data URL (<= ~50KB) --- */
  async function shrinkImage(file) {
    const source = await new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('Không đọc được file ảnh.')); };
      reader.readAsDataURL(file);
    });
    const img = new Image();
    img.src = source;
    await img.decode().catch(function () { throw new Error('Không đọc được file ảnh.'); });

    const W = 360, H = 540;
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d');
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25]) {
      const out = cv.toDataURL('image/jpeg', quality);
      if (out.length <= 68000) return out;
    }
    throw new Error('Không thể nén poster. Hãy chọn ảnh có kích thước nhỏ hơn.');
  }

  function initPoster(form, modal, fallback = function () { return ''; }) {
    const input = form.elements.namedItem('poster_url');
    const preview = form.querySelector('[data-poster-preview]');
    const fileInput = form.querySelector('[data-poster-file]');
    const link = form.querySelector('[data-poster-link]');
    const error = form.querySelector('[data-poster-error]');
    const status = form.querySelector('[data-poster-status]');
    let revision = 0, pending = false;

    function render() {
      const value = input.value || fallback();
      preview.innerHTML = value ? '<img alt="Xem trước poster" src="' + E(value) + '">' :
        '<span class="text-body-secondary small">Chưa có ảnh</span>';
    }
    function set(value, fromLink) {
      input.value = value || '';
      if (!fromLink) link.value = value && !value.startsWith('data:') ? value : '';
      error.textContent = '';
      App.setFieldError(form, 'poster_url', '');
      render();
    }
    function cancel() {
      revision++;
      pending = false;
      status.textContent = '';
      fileInput.value = '';
    }

    fileInput.addEventListener('change', async function () {
      const imageFile = fileInput.files[0];
      if (!imageFile) return;
      const request = ++revision;
      pending = true;
      error.textContent = '';
      App.setFieldError(form, 'poster_url', '');
      status.textContent = 'Đang xử lý ảnh…';
      try {
        if (!/^image\/(jpeg|png|webp)$/.test(imageFile.type)) throw new Error('Chỉ nhận ảnh JPG, PNG hoặc WebP.');
        if (imageFile.size > 8 * 1024 * 1024) throw new Error('Ảnh quá lớn (tối đa 8 MB).');
        const value = await shrinkImage(imageFile);
        if (request === revision) set(value);
      } catch (err) {
        if (request === revision) {
          error.textContent = err.message;
          fileInput.value = '';
        }
      } finally {
        if (request === revision) {
          pending = false;
          status.textContent = '';
        }
      }
    });
    link.addEventListener('input', function () { cancel(); set(link.value.trim(), true); });
    form.querySelector('[data-poster-clear]').addEventListener('click', function () { cancel(); set(''); });
    modal.addEventListener('hide.bs.modal', cancel);
    return {
      render,
      isPending() { return pending; },
      reset(value) { cancel(); set(value); },
      validate(errors) {
        if (pending) errors.poster_url = 'Vui lòng đợi xử lý ảnh xong rồi lưu.';
        else if (error.textContent) errors.poster_url = 'Hãy chọn lại ảnh hoặc dùng link poster.';
        return errors;
      }
    };
  }

  function openMovie(m) {
    editingMovie = m || null;
    const f = $('movieForm');
    f.reset(); App.clearErrors(f);
    $('movieModalTitle').textContent = m ? 'Sửa phim #' + m.id : 'Thêm phim';
    moviePoster.reset(m?.poster_url);
    if (m) { $('title').value = m.title; f.genre.value = m.genre; f.duration_min.value = m.duration_min; f.description.value = m.description; f.age_rating.value = m.age_rating; f.release_date.value = m.release_date; }
    movieModal.show();
  }

  let returnToShow = null, savingMovieForShow = false;

  function initMovies() {
    movieModal = new bootstrap.Modal($('movieModal'));
    moviePoster = initPoster($('movieForm'), $('movieModal'));
    $('movieModal').addEventListener('hide.bs.modal', function (event) {
      if (savingMovieForShow) event.preventDefault();
    });
    $('movieModal').addEventListener('hidden.bs.modal', function () {
      if (!returnToShow) return;
      const { movie } = returnToShow;
      returnToShow = null;
      if (movie) {
        movieOpts.push(movie);
        renderMovieOptions(movie.id);
        App.setFieldError($('showForm'), 'movie_id', '');
        showPoster.render();
      }
      showModal.show();
    });
    $('btnAddMovie').addEventListener('click', function () { openMovie(null); });
    $('movieSearch').addEventListener('input', App.debounce(function (e) { movieState.q = e.target.value; movieState.page = 1; loadMovies(); }, 300));
    $('moviePagination').addEventListener('click', function (e) {
      const a = e.target.closest('a[data-page]'); if (!a) return;
      e.preventDefault(); movieState.page = Number(a.dataset.page); loadMovies();
    });
    $('movieBody').addEventListener('click', function (e) {
      const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
      if (ed) openMovie(movieList.find(function (m) { return m.id === Number(ed.dataset.edit); }));
      if (dl) {
        const m = movieList.find(function (x) { return x.id === Number(dl.dataset.del); });
        App.confirmBox('Xóa phim "' + m.title + '"?', function () {
          Api.del('/api/movies/' + m.id).then(function (r) { App.showToast(r.message, 'warning'); loadMovies(); }).catch(App.showError);
        });
      }
    });
    App.bindForm($('movieForm'), function (d) { return moviePoster.validate(Validation.rules.movie(d)); }, async function (d) {
      const body = Object.assign({}, d, { duration_min: Number(d.duration_min) });
      let res;
      savingMovieForShow = Boolean(returnToShow);
      try {
        res = editingMovie ? await Api.put('/api/movies/' + editingMovie.id, body) : await Api.post('/api/movies', body);
        if (returnToShow) returnToShow.movie = res.item;
      } finally {
        savingMovieForShow = false;
      }
      movieModal.hide(); App.showToast(res.message); loadMovies();
      if ($('showBody')?.children.length) loadShows();
    });
  }

  /* ================= SUẤT CHIẾU ================= */
  const showState = { q: '', status: 'all', sort: 'asc', page: 1 };
  let showList = [], showModal, editingShow = null, movieOpts = [], showPoster, openingShow = false;

  async function loadShows(focusId) {
    const body = $('showBody');
    body.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border spinner-border-sm text-danger"></div></td></tr>';
    try {
      const res = await Api.get('/api/showtimes', Object.assign({ limit: 8, focus_id: focusId }, showState));
      showList = res.items; showState.page = res.page;
      body.innerHTML = res.items.length === 0 ? empty(7, 'Không có suất chiếu nào.') : res.items.map(function (s) {
        const done = s.status === 'Done';
        return '<tr' + (s.id === focusId ? ' class="table-active"' : '') + '><td>' + (s.poster_url ? '<img class="admin-thumb" alt="" src="' + E(s.poster_url) + '">' : '') + E(s.movie_title) + '</td><td class="text-nowrap">' + App.formatDate(s.show_date) + ' ' + s.show_time + '</td><td>' + E(s.room_name) + '</td>' +
          '<td class="text-end">' + App.formatMoney(s.price) + '</td><td class="text-end">' + s.booked + '/' + s.capacity + '</td>' +
          '<td><span class="badge ' + App.STATUS[s.status].badge + '">' + App.STATUS[s.status].label + '</span></td>' +
          '<td class="text-end text-nowrap"><button class="btn btn-sm ' + (done ? 'btn-outline-secondary' : 'btn-outline-success') + '" data-toggle="' + s.id + '" title="' + (done ? 'Chuyển về Sắp chiếu' : 'Đánh dấu Đã chiếu') + '" aria-label="Đổi trạng thái"><i class="bi ' + (done ? 'bi-arrow-counterclockwise' : 'bi-check2') + '"></i></button> ' +
          '<button class="btn btn-sm btn-outline-primary" data-edit="' + s.id + '" aria-label="Sửa suất chiếu"><i class="bi bi-pencil-square"></i></button> ' +
          (App.can(me, 'showtime:delete') ? '<button class="btn btn-sm btn-outline-danger" data-del="' + s.id + '" aria-label="Xóa suất chiếu"><i class="bi bi-trash3"></i></button>' : '') + '</td></tr>';
      }).join('');
      $('showPagination').innerHTML = App.paginationHtml(res.page, res.totalPages);
    } catch (e) { err(body, 7, e); }
  }

  function renderMovieOptions(selectedId) {
    const select = $('fMovie');
    select.innerHTML = '<option value="">-- Chọn phim --</option>' + movieOpts.map(function (movie) {
      return '<option value="' + movie.id + '">' + E(movie.title) + '</option>';
    }).join('');
    select.value = selectedId ?? '';
    $('fMovieHint').textContent = movieOpts.length ? '' : 'Chưa có phim trong hệ thống.';
  }

  async function openShow(s) {
    if (openingShow) return;
    openingShow = true;
    const add = $('btnAddShow');
    if (add) add.disabled = true;
    const openError = $('showOpenError');
    openError.hidden = true;
    try {
      const [rooms, movies] = await Promise.all([Api.get('/api/rooms'), Api.get('/api/movies', { all: 1 })]);
      movieOpts = movies.items;
      if (!rooms.items.length) throw new Error('Hãy thêm ít nhất một phòng chiếu trước khi tạo suất.');
      editingShow = s || null;
      const f = $('showForm');
      f.reset(); App.clearErrors(f);
      $('showSaveError').hidden = true;
      renderMovieOptions(s?.movie_id);
      $('fRoom').innerHTML = '<option value="">-- Chọn phòng --</option>' + rooms.items.map(function (r) { return '<option value="' + r.id + '">' + E(r.name) + ' (' + r.capacity + ' ghế)</option>'; }).join('');
      $('showModalTitle').textContent = s ? 'Sửa suất chiếu #' + s.id : 'Thêm suất chiếu';
      $('fRoom').value = s?.room_id ?? '';
      $('fDate').value = s?.show_date ?? App.todayStr();
      $('fTime').value = s?.show_time ?? '19:00';
      $('fPrice').value = s?.price ?? 90000;
      $('fStatus').value = s?.status ?? 'Pending';
      $('fNote').value = s?.note ?? '';
      showPoster.reset(s?.show_poster_url);
      showModal.show();
    } catch (err) {
      openError.textContent = err.message;
      openError.hidden = false;
    } finally {
      openingShow = false;
      if (add) add.disabled = false;
    }
  }

  function initShows() {
    showModal = new bootstrap.Modal($('showModal'));
    showPoster = initPoster($('showForm'), $('showModal'), function () {
      const movie = movieOpts.find(function (m) { return m.id === Number($('fMovie').value); });
      return movie?.poster_url || '';
    });
    $('fMovie').addEventListener('change', showPoster.render);
    const addMovie = $('btnAddMovieForShow');
    if (movieModal && App.can(me, 'movie:create')) {
      addMovie.hidden = false;
      addMovie.addEventListener('click', function () {
        if (showPoster.isPending()) {
          App.showToast('Vui lòng đợi xử lý ảnh xong.', 'warning');
          return;
        }
        returnToShow = {};
        $('showModal').addEventListener('hidden.bs.modal', function () {
          $('movieModal').addEventListener('shown.bs.modal', function () { $('title').focus(); }, { once: true });
          openMovie(null);
        }, { once: true });
        showModal.hide();
      });
    }
    $('btnAddShow')?.addEventListener('click', function () { openShow(null); });
    const reload = function () { showState.page = 1; loadShows(); };
    $('showSearch').addEventListener('input', App.debounce(function (e) { showState.q = e.target.value; reload(); }, 300));
    $('showStatus').addEventListener('change', function (e) { showState.status = e.target.value; reload(); });
    $('showSort').addEventListener('change', function (e) { showState.sort = e.target.value; reload(); });
    $('showPagination').addEventListener('click', function (e) {
      const a = e.target.closest('a[data-page]'); if (!a) return;
      e.preventDefault(); showState.page = Number(a.dataset.page); loadShows();
    });
    $('showBody').addEventListener('click', function (e) {
      const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]'), tg = e.target.closest('[data-toggle]');
      const find = function (id) { return showList.find(function (x) { return x.id === Number(id); }); };
      if (ed) openShow(find(ed.dataset.edit));
      if (tg) {
        const s = find(tg.dataset.toggle);
        Api.put('/api/showtimes/' + s.id, { movie_id: s.movie_id, room_id: s.room_id, show_date: s.show_date, show_time: s.show_time, price: s.price, note: s.note, status: s.status === 'Done' ? 'Pending' : 'Done' })
          .then(function () { App.showToast(s.status === 'Done' ? 'Đã chuyển về: Sắp chiếu.' : 'Đã đánh dấu: Đã chiếu.', 'info'); loadShows(); }).catch(App.showError);
      }
      if (dl) {
        const s = find(dl.dataset.del);
        App.confirmBox('Xóa suất chiếu "' + s.movie_title + '" ngày ' + App.formatDate(s.show_date) + ' ' + s.show_time + '? Không thể hoàn tác.', function () {
          Api.del('/api/showtimes/' + s.id).then(function (r) { App.showToast(r.message, 'warning'); loadShows(); }).catch(App.showError);
        });
      }
    });
    const saveError = $('showSaveError');
    $('showForm').addEventListener('input', function () { saveError.hidden = true; });
    App.bindForm($('showForm'), function (d) {
      return showPoster.validate(Validation.rules.showtime(d, editingShow?.show_date));
    }, async function (d) {
      const body = Object.assign({}, d, { movie_id: Number(d.movie_id), room_id: Number(d.room_id), price: Number(d.price) });
      try {
        const res = editingShow ? await Api.put('/api/showtimes/' + editingShow.id, body) : await Api.post('/api/showtimes', body);
        if (!editingShow) {
          showState.q = $('showSearch').value = '';
          showState.status = $('showStatus').value = 'all';
        }
        showModal.hide();
        App.showToast(res.message);
        loadShows(res.item.id);
      } catch (err) {
        saveError.textContent = err.message;
        saveError.hidden = false;
        throw err;
      }
    });
  }

  /* ================= PHÒNG ================= */
  let roomList = [], roomModal, editingRoom = null;

  async function loadRooms() {
    const body = $('roomBody');
    try {
      roomList = (await Api.get('/api/rooms')).items;
      body.innerHTML = roomList.length === 0 ? empty(3, 'Chưa có phòng chiếu nào.') : roomList.map(function (r) {
        return '<tr><td>' + E(r.name) + '</td><td class="text-end">' + r.capacity + '</td>' +
          '<td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-primary" data-edit="' + r.id + '"><i class="bi bi-pencil-square"></i></button> ' +
          '<button class="btn btn-sm btn-outline-danger" data-del="' + r.id + '"><i class="bi bi-trash3"></i></button></td></tr>';
      }).join('');
    } catch (e) { err(body, 3, e); }
  }

  function openRoom(r) {
    editingRoom = r || null;
    const f = $('roomForm');
    f.reset(); App.clearErrors(f);
    $('roomModalTitle').textContent = r ? 'Sửa phòng #' + r.id : 'Thêm phòng chiếu';
    if (r) { f.name.value = r.name; f.capacity.value = r.capacity; }
    roomModal.show();
  }

  function initRooms() {
    roomModal = new bootstrap.Modal($('roomModal'));
    $('btnAddRoom').addEventListener('click', function () { openRoom(null); });
    $('roomBody').addEventListener('click', function (e) {
      const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
      if (ed) openRoom(roomList.find(function (r) { return r.id === Number(ed.dataset.edit); }));
      if (dl) {
        const r = roomList.find(function (x) { return x.id === Number(dl.dataset.del); });
        App.confirmBox('Xóa "' + r.name + '"?', function () {
          Api.del('/api/rooms/' + r.id).then(function (res) { App.showToast(res.message, 'warning'); loadRooms(); }).catch(App.showError);
        });
      }
    });
    App.bindForm($('roomForm'), Validation.rules.room, async function (d) {
      const body = { name: d.name, capacity: Number(d.capacity) };
      const res = editingRoom ? await Api.put('/api/rooms/' + editingRoom.id, body) : await Api.post('/api/rooms', body);
      roomModal.hide(); App.showToast(res.message); loadRooms();
    });
  }

  /* ================= NGƯỜI DÙNG ================= */
  async function loadUsers() {
    const body = $('userBody');
    try {
      const res = await Api.get('/api/users');
      body.innerHTML = res.items.map(function (u) {
        const self = u.id === me.id;
        return '<tr><td>' + E(u.username) + (self ? ' <span class="badge text-bg-secondary">Bạn</span>' : '') + '</td><td>' + E(u.full_name) + '</td>' +
          '<td class="d-none d-md-table-cell">' + E(u.email) + '</td>' +
          '<td><select class="form-select form-select-sm" data-role="' + u.id + '" aria-label="Vai trò của ' + E(u.username) + '"' + (self ? ' disabled' : '') + '>' +
          ['customer', 'staff', 'manager'].map(function (r) { return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + App.ROLE[r].label + '</option>'; }).join('') + '</select></td></tr>';
      }).join('');
    } catch (e) { err(body, 4, e); }
  }

  function initUsers() {
    $('userBody').addEventListener('change', function (e) {
      const sel = e.target.closest('[data-role]'); if (!sel) return;
      Api.put('/api/users/' + sel.dataset.role + '/role', { role: sel.value })
        .then(function (r) { App.showToast(r.message); })
        .catch(function (x) { App.showError(x); loadUsers(); });
    });
  }

  /* ================= LIÊN HỆ ================= */
  async function loadContacts() {
    const body = $('contactBody');
    try {
      const res = await Api.get('/api/contacts');
      body.innerHTML = res.items.length === 0 ? empty(4, 'Chưa có liên hệ nào.') : res.items.map(function (c) {
        return '<tr><td class="text-nowrap">' + E(c.name) + '<div class="small text-body-secondary">' + E(c.email) + '</div></td>' +
          '<td>' + E(c.message) + '</td><td class="small text-nowrap">' + E(c.created_at) + '</td>' +
          '<td class="text-end">' + (App.can(me, 'contact:delete') ? '<button class="btn btn-sm btn-outline-danger" data-del="' + c.id + '"><i class="bi bi-trash3"></i></button>' : '') + '</td></tr>';
      }).join('');
    } catch (e) { err(body, 4, e); }
  }

  function initContacts() {
    $('contactBody').addEventListener('click', function (e) {
      const dl = e.target.closest('[data-del]'); if (!dl) return;
      App.confirmBox('Xóa liên hệ này?', function () {
        Api.del('/api/contacts/' + dl.dataset.del).then(function (r) { App.showToast(r.message, 'warning'); loadContacts(); }).catch(App.showError);
      });
    });
  }

  /* ================= VÉ (nhân viên + quản lý) ================= */
  async function loadBookings() {
    const body = $('bookingBody');
    try {
      const res = await Api.get('/api/bookings');
      body.innerHTML = res.items.length === 0 ? empty(7, 'Chưa có vé nào.') : res.items.map(function (b) {
        const cancellable = b.status === 'Pending';
        return '<tr><td class="text-nowrap"><strong>' + E(b.code) + '</strong></td>' +
          '<td>' + E(b.movie_title) + '<div class="small text-body-secondary">' + App.formatDate(b.show_date) + ' ' + b.show_time + ' &middot; ' + E(b.room_name) + '</div></td>' +
          '<td>' + b.seat_labels.map(function (l) { return '<span class="seat-pill">' + l + '</span>'; }).join('') + '</td>' +
          '<td class="d-none d-md-table-cell">' + E(b.customer_name) + '<div class="small text-body-secondary">' + E(b.customer_phone || '') + '</div></td>' +
          '<td class="d-none d-lg-table-cell">' + (b.channel === 'counter' ? '<span class="badge text-bg-info">Tại quầy</span><div class="small text-body-secondary">' + E(b.sold_by_name || '') + '</div>' : '<span class="badge text-bg-secondary">Online</span>') + '</td>' +
          '<td class="text-end text-nowrap">' + App.formatMoney(b.total_price) + '</td>' +
          '<td class="text-end">' + (cancellable ? '<button class="btn btn-sm btn-outline-danger" data-cancel="' + b.id + '" data-code="' + E(b.code) + '" aria-label="Hủy vé"><i class="bi bi-x-circle"></i></button>' : '') + '</td></tr>';
      }).join('');
    } catch (e) { err(body, 7, e); }
  }

  function initBookings() {
    $('bookingBody').addEventListener('click', function (e) {
      const c = e.target.closest('[data-cancel]'); if (!c) return;
      App.confirmBox('Hủy vé ' + c.dataset.code + '? Ghế sẽ được trả lại.', function () {
        Api.del('/api/bookings/' + c.dataset.cancel).then(function (r) { App.showToast(r.message, 'warning'); loadBookings(); }).catch(App.showError);
      });
    });
  }

  async function init() {
    me = await App.init({ require: 'user', permission: 'admin:access' });
    if (!me) return;
    if (me.role === 'staff') {
      $('adminTitle').textContent = 'Quầy vé & nghiệp vụ';
      $('adminSub').textContent = 'Nhân viên: bán / hủy vé, sửa suất chiếu và xem liên hệ. Thêm suất chiếu, phim, phòng, người dùng và thống kê chỉ Quản lý mới có.';
    }
    // Ẩn tab (và nội dung) mà vai trò hiện tại không có quyền
    document.querySelectorAll('li[data-perm]').forEach(function (li) {
      if (App.can(me, li.dataset.perm)) return;
      const pane = document.querySelector(li.querySelector('[data-bs-target]').dataset.bsTarget);
      if (pane) pane.remove();
      li.remove();
    });
    // Chỉ khởi tạo phần có trong trang (tab đã bị ẩn thì bỏ qua)
    [['tabMovies', initMovies], ['tabShows', initShows], ['tabRooms', initRooms], ['tabUsers', initUsers], ['tabContacts', initContacts], ['tabBookings', initBookings]]
      .forEach(function (x) { if ($(x[0])) x[1](); });
    // Chỉ Quản lý được thêm suất chiếu (nhân viên chỉ sửa / đổi trạng thái)
    if (!App.can(me, 'showtime:create') && $('btnAddShow')) $('btnAddShow').remove();
    // Tải tab khi được mở lần đầu
    const loaded = {};
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(function (t) {
      t.addEventListener('shown.bs.tab', function () {
        const k = t.dataset.bsTarget;
        if (loaded[k]) return;
        loaded[k] = true;
        if (k === '#tabMovies') loadMovies();
        if (k === '#tabRooms') loadRooms();
        if (k === '#tabBookings') loadBookings();
        if (k === '#tabShows') loadShows();
        if (k === '#tabUsers') loadUsers();
        if (k === '#tabContacts') loadContacts();
      });
    });
    const first = document.querySelector('[data-bs-toggle="tab"]');
    if (first) bootstrap.Tab.getOrCreateInstance(first).show();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
