if (!/^CineManagerTest_/.test(process.env.DB_NAME || '')) throw new Error('Chạy npm run test:integration để tạo database test riêng.');
const test = require('node:test');
const assert = require('node:assert');
const server = require('../server');
let base;
test.before(async () => {
  await server.initialize();
  await new Promise(ok => server.listen(0, () => {
    base = 'http://localhost:' + server.address().port;
    ok();
  }));
});
test.after(async () => {
  await new Promise(ok => server.close(ok));
  await require('../src/db').db.close();
});

// Mỗi "client" giữ cookie riêng (giống 1 trình duyệt)
function client() {
  let cookie = '';
  return async function call(method, url, body) {
    const res = await fetch(base + url, {
      method,
      headers: Object.assign({
        Cookie: cookie
      }, body ? {
        'Content-Type': 'application/json'
      } : {}),
      body: body ? JSON.stringify(body) : undefined
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    let data = null;
    try {
      data = await res.json();
    } catch (e) {/* rỗng */}
    return {
      status: res.status,
      data
    };
  };
}
const manager = client(),
  user = client(),
  guest = client();
let showId, movieId, roomId;
test('Đăng nhập sai / đúng', async () => {
  assert.strictEqual((await guest('POST', '/api/auth/login', {
    username: 'quanly',
    password: 'sai'
  })).status, 401);
  assert.strictEqual((await manager('POST', '/api/auth/login', {
    username: 'quanly',
    password: 'Quanly@123'
  })).status, 200);
  assert.strictEqual((await manager('GET', '/api/auth/me')).data.user.role, 'manager');
});
test('Đăng ký: validate + trùng + luôn là role customer', async () => {
  let r = await guest('POST', '/api/auth/register', {
    username: 'a',
    email: 'x',
    full_name: '',
    password: '123'
  });
  assert.strictEqual(r.status, 422);
  assert.ok(r.data.errors.username && r.data.errors.email && r.data.errors.password);
  r = await user('POST', '/api/auth/register', {
    username: 'sv01',
    email: 'sv01@x.vn',
    full_name: 'Sinh Vien',
    password: 'Abc12345',
    role: 'manager'
  });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.data.user.role, 'customer'); // không cho tự chọn quản lý
  r = await guest('POST', '/api/auth/register', {
    username: 'SV01',
    email: 'k@x.vn',
    full_name: 'Sinh Vien',
    password: 'Abc12345'
  });
  assert.strictEqual(r.status, 409);
});
test('Mật khẩu được băm, không lưu plain text', async () => {
  const {
    db
  } = require('../src/db');
  const row = await db.prepare("SELECT password_hash FROM users WHERE username = 'sv01'").get();
  assert.ok(!row.password_hash.includes('Abc12345'));
  assert.match(row.password_hash, /^[0-9a-f]{32}:[0-9a-f]{128}$/);
});
test('Phân quyền: khách vãng lai / khách hàng không được thêm-sửa-xóa', async () => {
  const body = {
    movie_id: 1,
    room_id: 1,
    show_date: '2099-01-01',
    show_time: '10:00',
    price: 1000
  };
  assert.strictEqual((await guest('POST', '/api/showtimes', body)).status, 401);
  assert.strictEqual((await user('POST', '/api/showtimes', body)).status, 403);
  assert.strictEqual((await user('DELETE', '/api/showtimes/1')).status, 403);
  assert.strictEqual((await user('GET', '/api/users')).status, 403);
  assert.strictEqual((await guest('GET', '/api/bookings/mine')).status, 401);
});
test('Quản lý CRUD suất chiếu + validate + chống trùng lịch', async () => {
  let r = await manager('POST', '/api/showtimes', {
    movie_id: 1,
    room_id: 1,
    show_date: '2000-01-01',
    show_time: '25:00',
    price: -5
  });
  assert.strictEqual(r.status, 422);
  assert.ok(r.data.errors.show_date && r.data.errors.show_time && r.data.errors.price);
  const ok = {
    movie_id: 1,
    room_id: 5,
    show_date: '2099-01-01',
    show_time: '10:00',
    price: 100000,
    note: 'test'
  };
  r = await manager('POST', '/api/showtimes', ok);
  assert.strictEqual(r.status, 201);
  showId = r.data.item.id;
  assert.strictEqual((await manager('POST', '/api/showtimes', ok)).status, 409); // trùng phòng/ngày/giờ

  r = await manager('PUT', '/api/showtimes/' + showId, Object.assign({}, ok, {
    price: 120000
  }));
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.data.item.price, 120000);
  assert.strictEqual((await manager('PUT', '/api/showtimes/99999', ok)).status, 404);
});
test('Tìm kiếm không dấu, lọc, phân trang', async () => {
  let r = await guest('GET', '/api/showtimes?q=hanh%20dong');
  assert.ok(r.data.total >= 1);
  r = await guest('GET', '/api/showtimes?status=Done');
  assert.ok(r.data.items.every(s => s.status === 'Done'));
  r = await guest('GET', '/api/showtimes?limit=3&page=2');
  assert.strictEqual(r.data.items.length, 3);
  assert.strictEqual(r.data.page, 2);
  r = await guest('GET', '/api/showtimes?q=zzzkhongco');
  assert.strictEqual(r.data.total, 0);
});
test('Đặt vé: kiểm tra số ghế + chỉ hủy vé của mình', async () => {
  assert.strictEqual((await user('POST', '/api/bookings', {
    showtime_id: showId,
    seats: 0
  })).status, 422);
  assert.strictEqual((await user('POST', '/api/bookings', {
    showtime_id: showId,
    seats: 11
  })).status, 422);
  let r = await user('POST', '/api/bookings', {
    showtime_id: showId,
    seats: 10
  });
  assert.strictEqual(r.status, 201);
  const bookingId = r.data.id;
  // phòng VIP 30 ghế: đặt 10+10+10 ok, thêm nữa thì hết
  await user('POST', '/api/bookings', {
    showtime_id: showId,
    seats: 10
  });
  await user('POST', '/api/bookings', {
    showtime_id: showId,
    seats: 10
  });
  r = await user('POST', '/api/bookings', {
    showtime_id: showId,
    seats: 1
  });
  assert.strictEqual(r.status, 409);
  // khách hàng không hủy được vé của người khác; chủ vé hủy được
  const stranger = client();
  await stranger('POST', '/api/auth/register', {
    username: 'la01',
    email: 'la01@x.vn',
    full_name: 'Nguoi La',
    password: 'Abc12345'
  });
  assert.strictEqual((await stranger('DELETE', '/api/bookings/' + bookingId)).status, 404);
  assert.strictEqual((await user('DELETE', '/api/bookings/' + bookingId)).status, 200);
  // suất đã chiếu thì không đặt được
  const done = (await guest('GET', '/api/showtimes?status=Done')).data.items[0];
  assert.strictEqual((await user('POST', '/api/bookings', {
    showtime_id: done.id,
    seats: 1
  })).status, 409);
});
test('Toàn vẹn dữ liệu: không xóa suất đã có vé / phim đang có suất', async () => {
  assert.strictEqual((await manager('DELETE', '/api/showtimes/' + showId)).status, 409);
  assert.strictEqual((await manager('DELETE', '/api/movies/1')).status, 409);
  assert.strictEqual((await manager('DELETE', '/api/rooms/5')).status, 409);
});
test('CRUD phim & phòng', async () => {
  let r = await manager('POST', '/api/movies', {
    title: 'Phim thử',
    genre: 'Hài',
    duration_min: 90,
    description: ''
  });
  assert.strictEqual(r.status, 201);
  movieId = r.data.item.id;
  assert.strictEqual((await manager('POST', '/api/movies', {
    title: 'phim THỬ'.toLowerCase().replace('thử', 'thử'),
    genre: 'Hài',
    duration_min: 90
  })).status, 409);
  assert.strictEqual((await manager('PUT', '/api/movies/' + movieId, {
    title: 'Phim thử 2',
    genre: 'Hài',
    duration_min: 95
  })).status, 200);
  assert.strictEqual((await manager('DELETE', '/api/movies/' + movieId)).status, 200);
  r = await manager('POST', '/api/rooms', {
    name: 'Phòng 9',
    capacity: 50
  });
  roomId = r.data.item.id;
  assert.strictEqual((await manager('PUT', '/api/rooms/' + roomId, {
    name: 'Phòng 9',
    capacity: 0
  })).status, 422);
  assert.strictEqual((await manager('DELETE', '/api/rooms/' + roomId)).status, 200);
});
test('Hồ sơ cá nhân + đổi mật khẩu', async () => {
  assert.strictEqual((await user('PUT', '/api/auth/me', {
    full_name: 'Sinh Vien Moi',
    email: 'sv01@x.vn',
    phone: '0912345678'
  })).status, 200);
  assert.strictEqual((await user('PUT', '/api/auth/me', {
    full_name: 'X',
    email: 'bad'
  })).status, 422);
  assert.strictEqual((await user('PUT', '/api/auth/password', {
    current_password: 'sai',
    new_password: 'Abc12345'
  })).status, 422);
  assert.strictEqual((await user('PUT', '/api/auth/password', {
    current_password: 'Abc12345',
    new_password: 'Moi12345'
  })).status, 200);
  const again = client();
  assert.strictEqual((await again('POST', '/api/auth/login', {
    username: 'sv01',
    password: 'Moi12345'
  })).status, 200);
});
test('Chọn ghế: sơ đồ ghế, chống bán trùng, tính tiền VIP, hủy vé nhả ghế', async () => {
  // suất tạo ở bài trước (phòng VIP 30 ghế) đã hết ghế; tạo suất mới ở phòng 4 (IMAX 120 ghế)
  let r = await manager('POST', '/api/showtimes', {
    movie_id: 2,
    room_id: 4,
    show_date: '2099-02-02',
    show_time: '10:00',
    price: 100000
  });
  const sid = r.data.item.id;
  r = await guest('GET', '/api/showtimes/' + sid + '/seats');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.data.cols, 12);
  assert.strictEqual(r.data.rows.length, 10);
  assert.deepStrictEqual(r.data.taken, []);
  assert.strictEqual(r.data.vip_surcharge, 20000);
  const u = client();
  await u('POST', '/api/auth/login', {
    username: 'khach',
    password: 'Khach@123'
  });
  assert.strictEqual((await guest('POST', '/api/bookings', {
    showtime_id: sid,
    seat_labels: ['A1']
  })).status, 401);
  assert.strictEqual((await u('POST', '/api/bookings', {
    showtime_id: sid,
    seat_labels: []
  })).status, 422);
  assert.strictEqual((await u('POST', '/api/bookings', {
    showtime_id: sid,
    seat_labels: ['A1', 'A1']
  })).status, 422);
  assert.strictEqual((await u('POST', '/api/bookings', {
    showtime_id: sid,
    seat_labels: ['Z99']
  })).status, 422);

  // A1 = ghế thường (100.000), F1 = ghế VIP (120.000)
  r = await u('POST', '/api/bookings', {
    showtime_id: sid,
    seat_labels: ['f1', 'A1']
  });
  assert.strictEqual(r.status, 201);
  assert.deepStrictEqual(r.data.seat_labels, ['A1', 'F1']);
  assert.strictEqual(r.data.total_price, 220000);
  assert.match(r.data.code, /^CM\d{6}$/);

  // người khác không đặt trùng ghế đã bán
  const other = client();
  await other('POST', '/api/auth/login', {
    username: 'sv01',
    password: 'Moi12345'
  });
  r = await other('POST', '/api/bookings', {
    showtime_id: sid,
    seat_labels: ['B1', 'F1']
  });
  assert.strictEqual(r.status, 409);
  assert.ok(r.data.errors.seat_labels.includes('F1'));
  assert.deepStrictEqual((await guest('GET', '/api/showtimes/' + sid + '/seats')).data.taken.sort(), ['A1', 'F1']);

  // vé của tôi có ghế; hủy vé thì ghế trống lại
  const mine = (await u('GET', '/api/bookings/mine')).data.items.find(b => b.showtime_id === sid);
  assert.deepStrictEqual(mine.seat_labels, ['A1', 'F1']);
  assert.strictEqual((await u('DELETE', '/api/bookings/' + mine.id)).status, 200);
  assert.deepStrictEqual((await guest('GET', '/api/showtimes/' + sid + '/seats')).data.taken, []);
  assert.strictEqual((await manager('DELETE', '/api/showtimes/' + sid)).status, 200);
});
test('Phim: đang chiếu / sắp chiếu, chi tiết, validate poster & độ tuổi, lọc suất theo ngày', async () => {
  let r = await guest('GET', '/api/movies?all=1&state=coming');
  assert.ok(r.data.items.length >= 1 && r.data.items.every(m => m.state === 'coming'));
  r = await guest('GET', '/api/movies?all=1&state=showing');
  assert.ok(r.data.items.length >= 1 && r.data.items.every(m => m.state === 'showing'));
  r = await guest('GET', '/api/movies/1');
  assert.strictEqual(r.data.item.age_rating, 'T16');
  assert.strictEqual((await guest('GET', '/api/movies/9999')).status, 404);
  r = await manager('POST', '/api/movies', {
    title: 'Phim lỗi',
    genre: 'Hài',
    duration_min: 90,
    age_rating: 'X',
    poster_url: 'javascript:alert(1)',
    release_date: '32/13'
  });
  assert.strictEqual(r.status, 422);
  assert.ok(r.data.errors.age_rating && r.data.errors.poster_url && r.data.errors.release_date);
  r = await guest('GET', '/api/showtimes?upcoming=1&limit=50');
  assert.ok(r.data.items.length > 0 && r.data.items.every(s => s.status === 'Pending'));
  const day = r.data.items[0].show_date;
  r = await guest('GET', '/api/showtimes?date=' + day + '&limit=50');
  assert.ok(r.data.items.every(s => s.show_date === day));
});
test('Quản lý không tự đổi role của mình; thống kê; liên hệ', async () => {
  assert.strictEqual((await manager('PUT', '/api/users/1/role', {
    role: 'customer'
  })).status, 403);
  assert.strictEqual((await manager('PUT', '/api/users/2/role', {
    role: 'superuser'
  })).status, 422);
  assert.strictEqual((await guest('GET', '/api/stats')).status, 401); // thống kê chỉ Quản lý
  assert.strictEqual((await user('GET', '/api/stats')).status, 403);
  const s = await manager('GET', '/api/stats');
  assert.ok(s.data.total > 0 && s.data.revenue >= 0);
  assert.strictEqual((await guest('POST', '/api/contact', {
    name: 'A',
    email: 'bad',
    message: 'ngan'
  })).status, 422);
  assert.strictEqual((await guest('POST', '/api/contact', {
    name: 'Khách',
    email: 'k@x.vn',
    message: 'Xin chào, rạp mở cửa mấy giờ?'
  })).status, 201);
});
test('Đăng xuất hủy phiên', async () => {
  assert.strictEqual((await user('POST', '/api/auth/logout')).status, 200);
  assert.strictEqual((await user('GET', '/api/bookings/mine')).status, 401);
});
test('Không đọc được file ngoài thư mục public', async () => {
  const raw = await fetch(base + '/%2e%2e/server.js');
  assert.strictEqual(raw.status, 404);
  assert.strictEqual((await fetch(base + '/database/cinema.db')).status, 404);
});

// ---------- Ma trận phân quyền 3 actor: Khách / Nhân viên / Quản lý ----------
test('Phân quyền: bảng role_permissions đúng ma trận (guest, customer, staff, manager)', () => {
  const {
    db
  } = require('../src/db');
  const has = async (role, perm) => !!(await db.prepare('SELECT 1 FROM role_permissions WHERE role_code = ? AND permission_code = ?').get(role, perm));
  const matrix = {
    'movie:view': [1, 1, 1, 1],
    'contact:create': [1, 1, 0, 0],
    'profile:update': [0, 1, 1, 1],
    'booking:create': [0, 1, 0, 0],
    'booking:view_own': [0, 1, 0, 0],
    'booking:cancel_own': [0, 1, 0, 0],
    'booking:sell_counter': [0, 0, 1, 1],
    'booking:view_all': [0, 0, 1, 1],
    'booking:cancel_any': [0, 0, 1, 1],
    'showtime:update': [0, 0, 1, 1],
    'contact:view': [0, 0, 1, 1],
    'admin:access': [0, 0, 1, 1],
    'showtime:create': [0, 0, 0, 1],
    'showtime:delete': [0, 0, 0, 1],
    'movie:create': [0, 0, 0, 1],
    'room:delete': [0, 0, 0, 1],
    'contact:delete': [0, 0, 0, 1],
    'stats:view': [0, 0, 0, 1],
    'stats:revenue': [0, 0, 0, 1],
    'user:view': [0, 0, 0, 1],
    'user:change_role': [0, 0, 0, 1]
  };
  Object.entries(matrix).forEach(([perm, row]) => ['guest', 'customer', 'staff', 'manager'].forEach(async (role, i) => {
    assert.strictEqual(await has(role, perm), !!row[i], role + ' / ' + perm);
  }));
});
test('Nhân viên: bán vé quầy (bắt buộc SĐT), xem/hủy mọi vé, sửa suất; KHÔNG thêm/xóa suất, thống kê, vé của tôi', async () => {
  const staff = client();
  assert.strictEqual((await staff('POST', '/api/auth/login', {
    username: 'nhanvien1',
    password: 'Nhanvien@123'
  })).status, 200);
  assert.strictEqual((await staff('GET', '/api/auth/me')).data.user.role, 'staff');
  const sh = (await guest('GET', '/api/showtimes?upcoming=1&limit=50&room_id=4')).data.items[0];

  // Bán tại quầy: BẮT BUỘC nhập số điện thoại khách
  let r = await staff('POST', '/api/bookings', {
    showtime_id: sh.id,
    seat_labels: ['H1'],
    channel: 'counter'
  });
  assert.strictEqual(r.status, 422);
  assert.ok(r.data.errors.customer_phone);
  assert.strictEqual((await staff('POST', '/api/bookings', {
    showtime_id: sh.id,
    seat_labels: ['H1'],
    customer_phone: '123'
  })).status, 422);
  // không gửi channel vẫn là bán quầy (nhân viên không có đặt vé online)
  assert.strictEqual((await staff('POST', '/api/bookings', {
    showtime_id: sh.id,
    seat_labels: ['H1']
  })).status, 422);

  // SĐT của khách đã có tài khoản (khach = 0900000002) -> vé vào "Vé của tôi" của khách
  r = await staff('POST', '/api/bookings', {
    showtime_id: sh.id,
    seat_labels: ['H1'],
    customer_phone: '0900000002'
  });
  assert.strictEqual(r.status, 201);
  const idCustomer = r.data.id;
  // khách vãng lai: lưu SĐT + tên
  r = await staff('POST', '/api/bookings', {
    showtime_id: sh.id,
    seat_labels: ['H2'],
    customer_phone: '0933444555',
    customer_name: 'Khách lẻ'
  });
  assert.strictEqual(r.status, 201);
  const kh = client();
  await kh('POST', '/api/auth/login', {
    username: 'khach',
    password: 'Khach@123'
  });
  assert.ok((await kh('GET', '/api/bookings/mine')).data.items.some(b => b.id === idCustomer));
  r = await staff('GET', '/api/bookings');
  assert.strictEqual(r.status, 200);
  const row = r.data.items.find(b => b.id === idCustomer);
  assert.strictEqual(row.channel, 'counter');
  assert.strictEqual(row.customer_phone, '0900000002');
  assert.strictEqual(row.sold_by_name, 'Lê Thị Quầy');
  const walkin = r.data.items.find(b => b.customer_phone === '0933444555');
  assert.strictEqual(walkin.customer_name, 'Khách lẻ');

  // Nhân viên / quản lý không có "Vé của tôi"
  assert.strictEqual((await staff('GET', '/api/bookings/mine')).status, 403);
  assert.strictEqual((await manager('GET', '/api/bookings/mine')).status, 403);
  // Khách hàng không được xem mọi vé, không được tự nhận bán quầy
  assert.strictEqual((await kh('GET', '/api/bookings')).status, 403);
  assert.strictEqual((await kh('POST', '/api/bookings', {
    showtime_id: sh.id,
    seat_labels: ['H4'],
    customer_phone: '0900000002'
  })).status, 403);
  assert.strictEqual((await guest('GET', '/api/bookings')).status, 401);

  // Nhân viên hủy được vé của khách
  assert.strictEqual((await staff('DELETE', '/api/bookings/' + idCustomer)).status, 200);

  // Suất chiếu: nhân viên KHÔNG thêm / xóa, chỉ sửa; quản lý thêm được
  const body = {
    movie_id: 1,
    room_id: 5,
    show_date: '2099-03-03',
    show_time: '10:00',
    price: 100000
  };
  assert.strictEqual((await staff('POST', '/api/showtimes', body)).status, 403);
  r = await manager('POST', '/api/showtimes', body);
  assert.strictEqual(r.status, 201);
  assert.strictEqual((await staff('PUT', '/api/showtimes/' + r.data.item.id, Object.assign({}, body, {
    price: 110000
  }))).status, 200);
  assert.strictEqual((await staff('DELETE', '/api/showtimes/' + r.data.item.id)).status, 403);
  assert.strictEqual((await manager('DELETE', '/api/showtimes/' + r.data.item.id)).status, 200);

  // Liên hệ: xem được, xóa không
  assert.strictEqual((await staff('GET', '/api/contacts')).status, 200); // đọc được liên hệ của khách
  assert.strictEqual((await staff('POST', '/api/contact', {
    name: 'NV',
    email: 'nv@x.vn',
    message: 'Nhân viên không gửi liên hệ'
  })).status, 403);
  assert.strictEqual((await manager('POST', '/api/contact', {
    name: 'QL',
    email: 'ql@x.vn',
    message: 'Quản lý không gửi liên hệ'
  })).status, 403);
  assert.strictEqual((await staff('DELETE', '/api/contacts/1')).status, 403);

  // Những thứ chỉ Quản lý có
  assert.strictEqual((await staff('POST', '/api/movies', {
    title: 'X',
    genre: 'Y',
    duration_min: 90
  })).status, 403);
  assert.strictEqual((await staff('DELETE', '/api/movies/1')).status, 403);
  assert.strictEqual((await staff('POST', '/api/rooms', {
    name: 'P',
    capacity: 10
  })).status, 403);
  assert.strictEqual((await staff('GET', '/api/users')).status, 403);
  assert.strictEqual((await staff('PUT', '/api/users/4/role', {
    role: 'manager'
  })).status, 403);
  assert.strictEqual((await staff('GET', '/api/stats')).status, 403); // thống kê chỉ Quản lý
});
test('Quản lý: đổi vai trò người dùng, xem doanh thu; khách hàng bị chặn trang quản trị', async () => {
  assert.strictEqual((await manager('PUT', '/api/users/4/role', {
    role: 'staff'
  })).status, 200);
  assert.strictEqual((await manager('PUT', '/api/users/4/role', {
    role: 'customer'
  })).status, 200);
  const me = (await manager('GET', '/api/auth/me')).data.user;
  assert.ok(me.permissions.includes('user:change_role') && me.permissions.includes('stats:revenue'));
  const kh = client();
  await kh('POST', '/api/auth/login', {
    username: 'khach',
    password: 'Khach@123'
  });
  const kme = (await kh('GET', '/api/auth/me')).data.user;
  assert.ok(!kme.permissions.includes('admin:access') && kme.permissions.includes('booking:create'));
  assert.strictEqual((await kh('GET', '/api/contacts')).status, 403);
  assert.strictEqual((await kh('PUT', '/api/users/4/role', {
    role: 'manager'
  })).status, 403);
});
test('Poster phim: nhận ảnh tải lên (data URL nhỏ), từ chối ảnh quá lớn / sai định dạng', async () => {
  const tiny = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=';
  let r = await manager('POST', '/api/movies', {
    title: 'Phim có ảnh',
    genre: 'Hài',
    duration_min: 90,
    poster_url: tiny
  });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.data.item.poster_url, tiny);
  assert.strictEqual((await manager('DELETE', '/api/movies/' + r.data.item.id)).status, 200);
  r = await manager('POST', '/api/movies', {
    title: 'Ảnh lỗi',
    genre: 'Hài',
    duration_min: 90,
    poster_url: 'data:text/html;base64,PHNjcmlwdD4='
  });
  assert.strictEqual(r.status, 422);
});
test('Suất chiếu: thêm ảnh riêng, tìm trang chứa suất mới và quay về poster phim', async () => {
  const base = {
    movie_id: 1,
    room_id: 1,
    show_date: '2099-03-10',
    show_time: '09:00',
    price: 90000
  };
  const movie = (await guest('GET', '/api/movies/1')).data.item;
  const firstPoster = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jK1sAAAAASUVORK5CYII=';
  const secondPoster = '/assets/posters/nha-co-khach.jpg';
  let r = await manager('POST', '/api/showtimes', {
    ...base,
    poster_url: 'data:text/html;base64,QQ=='
  });
  assert.strictEqual(r.status, 422);
  assert.ok(r.data.errors.poster_url);
  r = await manager('POST', '/api/showtimes', {
    ...base,
    poster_url: firstPoster
  });
  assert.strictEqual(r.status, 201);
  const id = r.data.item.id;
  const url = '/api/showtimes/' + id;
  assert.strictEqual(r.data.item.poster_url, firstPoster);
  assert.strictEqual(r.data.item.show_poster_url, firstPoster);
  r = await guest('GET', '/api/showtimes?limit=2&focus_id=' + id);
  assert.ok(r.data.page > 1);
  assert.ok(r.data.items.some(item => item.id === id && item.poster_url === firstPoster));
  assert.strictEqual((await guest('GET', url + '/seats')).data.item.poster_url, firstPoster);
  r = await manager('PUT', url, {
    ...base,
    poster_url: secondPoster
  });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.data.item.poster_url, secondPoster);
  r = await manager('PUT', url, {
    ...base,
    status: 'Done'
  });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.data.item.poster_url, secondPoster);
  r = await manager('PUT', url, {
    ...base,
    poster_url: ''
  });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.data.item.show_poster_url, '');
  assert.strictEqual(r.data.item.poster_url, movie.poster_url);
  assert.strictEqual((await manager('DELETE', url)).status, 200);
});
