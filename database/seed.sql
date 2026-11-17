-- ============================================================
-- CineManager - DỮ LIỆU MẪU cho từng bảng (chạy sau schema.sql + permissions.sql)
-- Dùng:  npm run seed   (xóa CSDL cũ, nạp lại schema + permissions + file này)
-- Ngày giờ dùng date('now', '+N day') nên lịch chiếu luôn "mới" so với hôm nay.
--
-- Tài khoản mẫu (mật khẩu đã băm scrypt, không lưu plain text):
--   quanly     / Quanly@123    -> Quản lý
--   nhanvien1  / Nhanvien@123  -> Nhân viên
--   nhanvien2  / Nhanvien@123  -> Nhân viên
--   khach      / Khach@123     -> Khách hàng (+ lan, minh, hoa cùng mật khẩu Khach@123)
-- ============================================================
PRAGMA foreign_keys = ON;

-- ---------- users: 1 quản lý, 2 nhân viên, 4 khách hàng ----------
INSERT INTO users (id, username, email, full_name, phone, password_hash, role) VALUES
  (1, 'quanly', 'quanly@cinemanager.vn', 'Trần Quốc Quản', '0900000001', 'a3574e61a71e0235d7d8b4c8e1714310:8959b65cc538da3a0e064586a69128fba6c5fe18314a63d48bb699e3cb77266a96e4f8a5c530af01e21ce4df7cb78db8d2b92287554695471871f7a381a278ee', 'manager'),
  (2, 'nhanvien1', 'nv1@cinemanager.vn', 'Lê Thị Quầy', '0900000011', '7b4bfea8cc6677deeb7b1866b90db312:e8a81d306e117a9bb07d91b89cc3a7dbfbe536237d94d7822c746d8e74ffb3f70ca3604ef976cf6b3a9477214716e4081da4222fab33e19a3f79603ef7ba2af0', 'staff'),
  (3, 'nhanvien2', 'nv2@cinemanager.vn', 'Phạm Văn Soát', '0900000012', '931ae2043ab39a67339cbb0c15b0d4a9:bda8a6489faed2d6dfdcb31d01c132512834864571758897de021e7f64b8751617a45ae5d8933e82a6433d5d6374ada85ac7f4782fb0552ed85401c951f4cb3e', 'staff'),
  (4, 'khach', 'khach@example.com', 'Nguyễn Văn Khách', '0900000002', 'c425f221da4627ab5ecb21d97dd75eb2:f240a4f39e45b88bf7ce469b5220908125217199ae3a72ad85acc034e483fc8e46aa7dd131151b575d60c9c0b1742324a3dec3a316df7f45022d1635359b45bc', 'customer'),
  (5, 'lan', 'lan.nguyen@example.com', 'Nguyễn Thị Lan', '0900000003', '96910c55d4b2f601b6056eac733d90f7:ac60f3a64a503a75ee43b7716eb78c9073111bcc12c6d09c87b150b44c05453d0e8f197bd5df9b9862bbfd9a9282c9d0f14a8b490c64ddb9de88b00c471723d3', 'customer'),
  (6, 'minh', 'minh.tran@example.com', 'Trần Quang Minh', '0900000004', 'cfc23b17cd09dc77ef1f3046e62162c6:7f034b0b76e5b96b8cdca7173085b4b427aa6c4e89175bf768b059ae46571ce4e9408de27d12ce20f2091e9e3a8a32a6ae8c1621e4f5fe648e797da464ffb7cf', 'customer'),
  (7, 'hoa', 'hoa.le@example.com', 'Lê Thị Hoa', '0900000005', '5e1ad17c87b90ef2e4c479ced6f7bec2:f36263740d552b8b11b7ab91460fe5ee1873b0108ec55f352a147f20ea11bf1a1cef9c216ad30abcfab4b5b2b5497db388530c01fd41783ab60d9b39554811e5', 'customer');

-- ---------- sessions: sinh tự động khi đăng nhập (token ngẫu nhiên) nên không nạp mẫu.
-- Muốn xem cấu trúc:  SELECT * FROM sessions;  (rỗng cho tới khi có người đăng nhập)

-- ---------- rooms ----------
INSERT INTO rooms (id, name, capacity) VALUES
  (1, 'Phòng 1', 80),
  (2, 'Phòng 2', 80),
  (3, 'Phòng 3', 60),
  (4, 'Phòng 4 (IMAX)', 120),
  (5, 'Phòng 5 (VIP)', 30);

-- ---------- movies: 6 phim đang chiếu (khởi chiếu trong quá khứ) + 4 phim sắp chiếu ----------
INSERT INTO movies (id, title, genre, duration_min, description, age_rating, release_date, poster_url) VALUES
  (1, 'Truy Kích', 'Hành động', 120, 'Phim hành động nghẹt thở với những pha rượt đuổi mãn nhãn.', 'T16', date('now','localtime','-30 day'), '/assets/posters/truy-kich.jpg'),
  (2, 'Chuyến phiêu lưu kỳ diệu', 'Hoạt hình', 95, 'Hoạt hình gia đình dành cho trẻ em, có nhiều bài học ý nghĩa.', 'P', date('now','localtime','-20 day'), '/assets/posters/chuyen-phieu-luu-ky-dieu.jpg'),
  (3, 'Chuyện tình mùa thu', 'Tình cảm', 110, 'Câu chuyện tình lãng mạn, nhẹ nhàng giữa mùa lá rụng.', 'T13', date('now','localtime','-25 day'), '/assets/posters/chuyen-tinh-mua-thu.jpg'),
  (4, 'Kinh dị đêm khuya', 'Kinh dị', 100, 'Phim kinh dị dành cho khán giả từ 18 tuổi.', 'T18', date('now','localtime','-15 day'), '/assets/posters/kinh-di-dem-khuya.jpg'),
  (5, 'Nhà có khách', 'Hài', 105, 'Phim hài Tết với nhiều tình huống dở khóc dở cười.', 'T13', date('now','localtime','-10 day'), '/assets/posters/nha-co-khach.jpg'),
  (6, 'Biển xanh', 'Tài liệu', 80, 'Phim tài liệu về hệ sinh thái đại dương.', 'P', date('now','localtime','-40 day'), '/assets/posters/bien-xanh.jpg'),
  (7, 'Mật mã thời gian', 'Khoa học viễn tưởng', 130, 'Một nhà khoa học phát hiện ra bí mật có thể thay đổi quá khứ.', 'T13', date('now','localtime','+14 day'), '/assets/posters/mat-ma-thoi-gian.jpg'),
  (8, 'Cuộc đua sinh tử', 'Hành động', 115, 'Những tay đua đường phố tranh tài trong giải đấu không luật lệ.', 'T16', date('now','localtime','+21 day'), '/assets/posters/cuoc-dua-sinh-tu.jpg'),
  (9, 'Mùa hè rực rỡ', 'Tình cảm', 108, 'Chuyện tình tuổi trẻ bên bờ biển trong một mùa hè khó quên.', 'T13', date('now','localtime','+10 day'), '/assets/posters/mua-he-ruc-ro.jpg'),
  (10, 'Ngôi nhà ma ám', 'Kinh dị', 98, 'Gia đình nọ chuyển đến ngôi nhà cũ và nhận ra mình không đơn độc.', 'T18', date('now','localtime','+30 day'), '/assets/posters/ngoi-nha-ma-am.jpg');

-- ---------- showtimes: 4 suất Done (đã chiếu) + 20 suất Pending trong 6 ngày tới ----------
INSERT INTO showtimes (id, movie_id, room_id, show_date, show_time, price, status, note) VALUES
  (1, 3, 3, date('now','localtime','-3 day'), '19:00', 85000, 'Done', 'Suất chiếu đã kết thúc.'),
  (2, 5, 1, date('now','localtime','-5 day'), '20:30', 85000, 'Done', 'Suất chiếu đã kết thúc.'),
  (3, 1, 4, date('now','localtime','-2 day'), '19:30', 150000, 'Done', 'Suất IMAX đã kết thúc.'),
  (4, 6, 2, date('now','localtime','-1 day'), '14:00', 50000, 'Done', 'Suất chiếu dành cho học sinh, sinh viên.'),
  (5, 1, 4, date('now','localtime','+1 day'), '19:30', 120000, 'Pending', 'Suất đầu tuần, dự kiến kín ghế.'),
  (6, 2, 1, date('now','localtime','+1 day'), '09:30', 70000, 'Pending', 'Dành cho trẻ em, có combo bắp nước.'),
  (7, 3, 2, date('now','localtime','+1 day'), '20:00', 85000, 'Pending', 'Chiếu buổi tối.'),
  (8, 4, 3, date('now','localtime','+1 day'), '22:00', 90000, 'Pending', 'Suất 22h, chỉ dành cho khán giả từ 18 tuổi.'),
  (9, 5, 5, date('now','localtime','+2 day'), '18:00', 150000, 'Pending', 'Suất đặc biệt cho khách đặt vé nhóm.'),
  (10, 6, 2, date('now','localtime','+2 day'), '14:00', 50000, 'Pending', 'Suất chiếu dành cho học sinh, sinh viên.'),
  (11, 1, 1, date('now','localtime','+2 day'), '15:30', 90000, 'Pending', ''),
  (12, 2, 4, date('now','localtime','+2 day'), '10:00', 100000, 'Pending', ''),
  (13, 3, 3, date('now','localtime','+2 day'), '19:00', 85000, 'Pending', ''),
  (14, 5, 1, date('now','localtime','+3 day'), '09:30', 70000, 'Pending', ''),
  (15, 5, 2, date('now','localtime','+3 day'), '13:00', 85000, 'Pending', ''),
  (16, 4, 4, date('now','localtime','+3 day'), '21:45', 140000, 'Pending', ''),
  (17, 1, 5, date('now','localtime','+3 day'), '19:30', 170000, 'Pending', 'Phòng VIP, ghế massage.'),
  (18, 2, 2, date('now','localtime','+4 day'), '09:30', 70000, 'Pending', ''),
  (19, 3, 1, date('now','localtime','+4 day'), '16:15', 90000, 'Pending', ''),
  (20, 5, 4, date('now','localtime','+4 day'), '19:30', 140000, 'Pending', ''),
  (21, 1, 3, date('now','localtime','+5 day'), '13:00', 85000, 'Pending', ''),
  (22, 6, 5, date('now','localtime','+5 day'), '16:15', 150000, 'Pending', ''),
  (23, 2, 1, date('now','localtime','+6 day'), '13:00', 85000, 'Pending', ''),
  (24, 4, 2, date('now','localtime','+6 day'), '21:45', 110000, 'Pending', '');

-- ---------- bookings: vé đặt online (channel=online) và bán tại quầy (channel=counter: có sold_by + customer_phone; khách vãng lai có thêm customer_name) ----------
INSERT INTO bookings (id, user_id, showtime_id, seats, total_price, channel, sold_by, customer_phone, customer_name, created_at) VALUES
  (1, 4, 5, 2, 288000, 'online', NULL, NULL, NULL, datetime('now','localtime')),
  (2, 4, 7, 3, 306000, 'online', NULL, NULL, NULL, datetime('now','localtime')),
  (3, 5, 5, 6, 816000, 'online', NULL, NULL, NULL, datetime('now','localtime','-1 day')),
  (4, 6, 5, 4, 480000, 'counter', 2, '0900000004', NULL, datetime('now','localtime','-1 day')),
  (5, 7, 6, 2, 140000, 'online', NULL, NULL, NULL, datetime('now','localtime')),
  (6, 4, 9, 3, 450000, 'online', NULL, NULL, NULL, datetime('now','localtime','-1 day')),
  (7, 2, 8, 2, 216000, 'counter', 2, '0987654321', 'Khách vãng lai', datetime('now','localtime')),
  (8, 3, 11, 4, 432000, 'counter', 3, '0911222333', 'Đặng Văn Khoa', datetime('now','localtime')),
  (9, 5, 14, 2, 168000, 'online', NULL, NULL, NULL, datetime('now','localtime')),
  (10, 6, 17, 4, 680000, 'online', NULL, NULL, NULL, datetime('now','localtime')),
  (11, 4, 1, 2, 204000, 'online', NULL, NULL, NULL, datetime('now','localtime','-4 day')),
  (12, 5, 2, 3, 306000, 'online', NULL, NULL, NULL, datetime('now','localtime','-6 day')),
  (13, 7, 3, 3, 540000, 'counter', 2, '0900000005', NULL, datetime('now','localtime','-3 day')),
  (14, 6, 4, 1, 50000, 'online', NULL, NULL, NULL, datetime('now','localtime','-2 day'));

-- ---------- booking_seats: ghế cụ thể của từng vé (UNIQUE theo suất + ghế nên không bán trùng) ----------
INSERT INTO booking_seats (booking_id, showtime_id, seat_label) VALUES
  (1, 5, 'F6'),
  (1, 5, 'F7'),
  (2, 7, 'E5'),
  (2, 7, 'E6'),
  (2, 7, 'E7'),
  (3, 5, 'D8'),
  (3, 5, 'D9'),
  (3, 5, 'E3'),
  (3, 5, 'E4'),
  (3, 5, 'E5'),
  (3, 5, 'G10'),
  (4, 5, 'B1'),
  (4, 5, 'B2'),
  (4, 5, 'C11'),
  (4, 5, 'C12'),
  (5, 6, 'A1'),
  (5, 6, 'A2'),
  (6, 9, 'A1'),
  (6, 9, 'A2'),
  (6, 9, 'A3'),
  (7, 8, 'C4'),
  (7, 8, 'C5'),
  (8, 11, 'D5'),
  (8, 11, 'D6'),
  (8, 11, 'D7'),
  (8, 11, 'D8'),
  (9, 14, 'E5'),
  (9, 14, 'E6'),
  (10, 17, 'A1'),
  (10, 17, 'A2'),
  (10, 17, 'B1'),
  (10, 17, 'B2'),
  (11, 1, 'E5'),
  (11, 1, 'E6'),
  (12, 2, 'D4'),
  (12, 2, 'D5'),
  (12, 2, 'D6'),
  (13, 3, 'F6'),
  (13, 3, 'F7'),
  (13, 3, 'F8'),
  (14, 4, 'C3');

-- ---------- contacts ----------
INSERT INTO contacts (id, name, email, message, created_at) VALUES
  (1, 'Trần Thị B', 'b@example.com', 'Rạp có chương trình giảm giá cho sinh viên không ạ?', datetime('now','localtime')),
  (2, 'Nguyễn Văn C', 'c@example.com', 'Cho mình hỏi rạp có chỗ gửi xe máy miễn phí không?', datetime('now','localtime','-1 day')),
  (3, 'Lê Hoàng D', 'd@example.com', 'Mình muốn đặt cả phòng VIP cho sinh nhật 20 người, liên hệ thế nào?', datetime('now','localtime','-2 day')),
  (4, 'Phạm Thu E', 'e@example.com', 'Suất 22h phim Kinh dị đêm khuya có cho trẻ em đi cùng không?', datetime('now','localtime','-3 day')),
  (5, 'Võ Minh F', 'f@example.com', 'Ghế ở phòng IMAX rất thoải mái, cảm ơn rạp!', datetime('now','localtime','-5 day'));

-- Kiểm tra nhanh:
--   SELECT role, COUNT(*) FROM users GROUP BY role;
--   SELECT channel, COUNT(*), SUM(total_price) FROM bookings GROUP BY channel;
