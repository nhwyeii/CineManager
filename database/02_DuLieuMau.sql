-- Dữ liệu mẫu gốc: giữ tài khoản, phim, ảnh, phòng, vé, ghế và liên hệ.
USE CineManager;
GO
SET XACT_ABORT ON;
IF EXISTS (SELECT 1 FROM dbo.users)
    THROW 50002, N'Chỉ nạp mẫu vào database trống. Không xóa dữ liệu hiện tại.', 1;
BEGIN TRANSACTION;

SET IDENTITY_INSERT users ON;
INSERT INTO users (id, username, email, full_name, phone, password_hash, role) VALUES
  (1, N'quanly', N'quanly@cinemanager.vn', N'Trần Quốc Quản', N'0900000001',quanly123@, N'manager'),
  (2, N'nhanvien1', N'nv1@cinemanager.vn', N'Lê Thị Quầy', N'0900000011', N'7b4bfea8cc6677deeb7b1866b90db312:e8a81d306e117a9bb07d91b89cc3a7dbfbe536237d94d7822c746d8e74ffb3f70ca3604ef976cf6b3a9477214716e4081da4222fab33e19a3f79603ef7ba2af0', N'staff'),
  (3, N'nhanvien2', N'nv2@cinemanager.vn', N'Phạm Văn Soát', N'0900000012', N'931ae2043ab39a67339cbb0c15b0d4a9:bda8a6489faed2d6dfdcb31d01c132512834864571758897de021e7f64b8751617a45ae5d8933e82a6433d5d6374ada85ac7f4782fb0552ed85401c951f4cb3e', N'staff'),
  (4, N'khach', N'khach@example.com', N'Nguyễn Văn Khách', N'0900000002', N'c425f221da4627ab5ecb21d97dd75eb2:f240a4f39e45b88bf7ce469b5220908125217199ae3a72ad85acc034e483fc8e46aa7dd131151b575d60c9c0b1742324a3dec3a316df7f45022d1635359b45bc', N'customer'),
  (5, N'lan', N'lan.nguyen@example.com', N'Nguyễn Thị Lan', N'0900000003', N'96910c55d4b2f601b6056eac733d90f7:ac60f3a64a503a75ee43b7716eb78c9073111bcc12c6d09c87b150b44c05453d0e8f197bd5df9b9862bbfd9a9282c9d0f14a8b490c64ddb9de88b00c471723d3', N'customer'),
  (6, N'minh', N'minh.tran@example.com', N'Trần Quang Minh', N'0900000004', N'cfc23b17cd09dc77ef1f3046e62162c6:7f034b0b76e5b96b8cdca7173085b4b427aa6c4e89175bf768b059ae46571ce4e9408de27d12ce20f2091e9e3a8a32a6ae8c1621e4f5fe648e797da464ffb7cf', N'customer'),
  (7, N'hoa', N'hoa.le@example.com', N'Lê Thị Hoa', N'0900000005', N'5e1ad17c87b90ef2e4c479ced6f7bec2:f36263740d552b8b11b7ab91460fe5ee1873b0108ec55f352a147f20ea11bf1a1cef9c216ad30abcfab4b5b2b5497db388530c01fd41783ab60d9b39554811e5', N'customer');
SET IDENTITY_INSERT users OFF;

SET IDENTITY_INSERT rooms ON;
INSERT INTO rooms (id, name, capacity) VALUES
  (1, N'Phòng 1', 80),
  (2, N'Phòng 2', 80),
  (3, N'Phòng 3', 60),
  (4, N'Phòng 4 (IMAX)', 120),
  (5, N'Phòng 5 (VIP)', 30);
SET IDENTITY_INSERT rooms OFF;

SET IDENTITY_INSERT movies ON;
INSERT INTO movies (id, title, genre, duration_min, description, age_rating, release_date, poster_url) VALUES
  (1, N'Truy Kích', N'Hành động', 120, N'Phim hành động nghẹt thở với những pha rượt đuổi mãn nhãn.', N'T16', CONVERT(varchar(10), DATEADD(day, -30, SYSDATETIME()), 23), N'/assets/posters/truy-kich.jpg'),
  (2, N'Chuyến phiêu lưu kỳ diệu', N'Hoạt hình', 95, N'Hoạt hình gia đình dành cho trẻ em, có nhiều bài học ý nghĩa.', N'P', CONVERT(varchar(10), DATEADD(day, -20, SYSDATETIME()), 23), N'/assets/posters/chuyen-phieu-luu-ky-dieu.jpg'),
  (3, N'Chuyện tình mùa thu', N'Tình cảm', 110, N'Câu chuyện tình lãng mạn, nhẹ nhàng giữa mùa lá rụng.', N'T13', CONVERT(varchar(10), DATEADD(day, -25, SYSDATETIME()), 23), N'/assets/posters/chuyen-tinh-mua-thu.jpg'),
  (4, N'Kinh dị đêm khuya', N'Kinh dị', 100, N'Phim kinh dị dành cho khán giả từ 18 tuổi.', N'T18', CONVERT(varchar(10), DATEADD(day, -15, SYSDATETIME()), 23), N'/assets/posters/kinh-di-dem-khuya.jpg'),
  (5, N'Nhà có khách', N'Hài', 105, N'Phim hài Tết với nhiều tình huống dở khóc dở cười.', N'T13', CONVERT(varchar(10), DATEADD(day, -10, SYSDATETIME()), 23), N'/assets/posters/nha-co-khach.jpg'),
  (6, N'Biển xanh', N'Tài liệu', 80, N'Phim tài liệu về hệ sinh thái đại dương.', N'P', CONVERT(varchar(10), DATEADD(day, -40, SYSDATETIME()), 23), N'/assets/posters/bien-xanh.jpg'),
  (7, N'Mật mã thời gian', N'Khoa học viễn tưởng', 130, N'Một nhà khoa học phát hiện ra bí mật có thể thay đổi quá khứ.', N'T13', CONVERT(varchar(10), DATEADD(day, +14, SYSDATETIME()), 23), N'/assets/posters/mat-ma-thoi-gian.jpg'),
  (8, N'Cuộc đua sinh tử', N'Hành động', 115, N'Những tay đua đường phố tranh tài trong giải đấu không luật lệ.', N'T16', CONVERT(varchar(10), DATEADD(day, +21, SYSDATETIME()), 23), N'/assets/posters/cuoc-dua-sinh-tu.jpg'),
  (9, N'Mùa hè rực rỡ', N'Tình cảm', 108, N'Chuyện tình tuổi trẻ bên bờ biển trong một mùa hè khó quên.', N'T13', CONVERT(varchar(10), DATEADD(day, +10, SYSDATETIME()), 23), N'/assets/posters/mua-he-ruc-ro.jpg'),
  (10, N'Ngôi nhà ma ám', N'Kinh dị', 98, N'Gia đình nọ chuyển đến ngôi nhà cũ và nhận ra mình không đơn độc.', N'T18', CONVERT(varchar(10), DATEADD(day, +30, SYSDATETIME()), 23), N'/assets/posters/ngoi-nha-ma-am.jpg');
SET IDENTITY_INSERT movies OFF;

SET IDENTITY_INSERT showtimes ON;
INSERT INTO showtimes (id, movie_id, room_id, show_date, show_time, price, status, note) VALUES
  (1, 3, 3, CONVERT(varchar(10), DATEADD(day, -3, SYSDATETIME()), 23), N'19:00', 85000, N'Done', N'Suất chiếu đã kết thúc.'),
  (2, 5, 1, CONVERT(varchar(10), DATEADD(day, -5, SYSDATETIME()), 23), N'20:30', 85000, N'Done', N'Suất chiếu đã kết thúc.'),
  (3, 1, 4, CONVERT(varchar(10), DATEADD(day, -2, SYSDATETIME()), 23), N'19:30', 150000, N'Done', N'Suất IMAX đã kết thúc.'),
  (4, 6, 2, CONVERT(varchar(10), DATEADD(day, -1, SYSDATETIME()), 23), N'14:00', 50000, N'Done', N'Suất chiếu dành cho học sinh, sinh viên.'),
  (5, 1, 4, CONVERT(varchar(10), DATEADD(day, +1, SYSDATETIME()), 23), N'19:30', 120000, N'Pending', N'Suất đầu tuần, dự kiến kín ghế.'),
  (6, 2, 1, CONVERT(varchar(10), DATEADD(day, +1, SYSDATETIME()), 23), N'09:30', 70000, N'Pending', N'Dành cho trẻ em, có combo bắp nước.'),
  (7, 3, 2, CONVERT(varchar(10), DATEADD(day, +1, SYSDATETIME()), 23), N'20:00', 85000, N'Pending', N'Chiếu buổi tối.'),
  (8, 4, 3, CONVERT(varchar(10), DATEADD(day, +1, SYSDATETIME()), 23), N'22:00', 90000, N'Pending', N'Suất 22h, chỉ dành cho khán giả từ 18 tuổi.'),
  (9, 5, 5, CONVERT(varchar(10), DATEADD(day, +2, SYSDATETIME()), 23), N'18:00', 150000, N'Pending', N'Suất đặc biệt cho khách đặt vé nhóm.'),
  (10, 6, 2, CONVERT(varchar(10), DATEADD(day, +2, SYSDATETIME()), 23), N'14:00', 50000, N'Pending', N'Suất chiếu dành cho học sinh, sinh viên.'),
  (11, 1, 1, CONVERT(varchar(10), DATEADD(day, +2, SYSDATETIME()), 23), N'15:30', 90000, N'Pending', N''),
  (12, 2, 4, CONVERT(varchar(10), DATEADD(day, +2, SYSDATETIME()), 23), N'10:00', 100000, N'Pending', N''),
  (13, 3, 3, CONVERT(varchar(10), DATEADD(day, +2, SYSDATETIME()), 23), N'19:00', 85000, N'Pending', N''),
  (14, 5, 1, CONVERT(varchar(10), DATEADD(day, +3, SYSDATETIME()), 23), N'09:30', 70000, N'Pending', N''),
  (15, 5, 2, CONVERT(varchar(10), DATEADD(day, +3, SYSDATETIME()), 23), N'13:00', 85000, N'Pending', N''),
  (16, 4, 4, CONVERT(varchar(10), DATEADD(day, +3, SYSDATETIME()), 23), N'21:45', 140000, N'Pending', N''),
  (17, 1, 5, CONVERT(varchar(10), DATEADD(day, +3, SYSDATETIME()), 23), N'19:30', 170000, N'Pending', N'Phòng VIP, ghế massage.'),
  (18, 2, 2, CONVERT(varchar(10), DATEADD(day, +4, SYSDATETIME()), 23), N'09:30', 70000, N'Pending', N''),
  (19, 3, 1, CONVERT(varchar(10), DATEADD(day, +4, SYSDATETIME()), 23), N'16:15', 90000, N'Pending', N''),
  (20, 5, 4, CONVERT(varchar(10), DATEADD(day, +4, SYSDATETIME()), 23), N'19:30', 140000, N'Pending', N''),
  (21, 1, 3, CONVERT(varchar(10), DATEADD(day, +5, SYSDATETIME()), 23), N'13:00', 85000, N'Pending', N''),
  (22, 6, 5, CONVERT(varchar(10), DATEADD(day, +5, SYSDATETIME()), 23), N'16:15', 150000, N'Pending', N''),
  (23, 2, 1, CONVERT(varchar(10), DATEADD(day, +6, SYSDATETIME()), 23), N'13:00', 85000, N'Pending', N''),
  (24, 4, 2, CONVERT(varchar(10), DATEADD(day, +6, SYSDATETIME()), 23), N'21:45', 110000, N'Pending', N'');
SET IDENTITY_INSERT showtimes OFF;

SET IDENTITY_INSERT bookings ON;
INSERT INTO bookings (id, user_id, showtime_id, seats, total_price, channel, sold_by, customer_phone, customer_name, created_at) VALUES
  (1, 4, 5, 2, 288000, N'online', NULL, NULL, NULL, CONVERT(varchar(19), DATEADD(day, 0, SYSDATETIME()), 120)),
  (2, 4, 7, 3, 306000, N'online', NULL, NULL, NULL, CONVERT(varchar(19), DATEADD(day, 0, SYSDATETIME()), 120)),
  (3, 5, 5, 6, 816000, N'online', NULL, NULL, NULL, CONVERT(varchar(19), DATEADD(day, -1, SYSDATETIME()), 120)),
  (4, 6, 5, 4, 480000, N'counter', 2, N'0900000004', NULL, CONVERT(varchar(19), DATEADD(day, -1, SYSDATETIME()), 120)),
  (5, 7, 6, 2, 140000, N'online', NULL, NULL, NULL, CONVERT(varchar(19), DATEADD(day, 0, SYSDATETIME()), 120)),
  (6, 4, 9, 3, 450000, N'online', NULL, NULL, NULL, CONVERT(varchar(19), DATEADD(day, -1, SYSDATETIME()), 120)),
  (7, 2, 8, 2, 216000, N'counter', 2, N'0987654321', N'Khách vãng lai', CONVERT(varchar(19), DATEADD(day, 0, SYSDATETIME()), 120)),
  (8, 3, 11, 4, 432000, N'counter', 3, N'0911222333', N'Đặng Văn Khoa', CONVERT(varchar(19), DATEADD(day, 0, SYSDATETIME()), 120)),
  (9, 5, 14, 2, 168000, N'online', NULL, NULL, NULL, CONVERT(varchar(19), DATEADD(day, 0, SYSDATETIME()), 120)),
  (10, 6, 17, 4, 680000, N'online', NULL, NULL, NULL, CONVERT(varchar(19), DATEADD(day, 0, SYSDATETIME()), 120)),
  (11, 4, 1, 2, 204000, N'online', NULL, NULL, NULL, CONVERT(varchar(19), DATEADD(day, -4, SYSDATETIME()), 120)),
  (12, 5, 2, 3, 306000, N'online', NULL, NULL, NULL, CONVERT(varchar(19), DATEADD(day, -6, SYSDATETIME()), 120)),
  (13, 7, 3, 3, 540000, N'counter', 2, N'0900000005', NULL, CONVERT(varchar(19), DATEADD(day, -3, SYSDATETIME()), 120)),
  (14, 6, 4, 1, 50000, N'online', NULL, NULL, NULL, CONVERT(varchar(19), DATEADD(day, -2, SYSDATETIME()), 120));
SET IDENTITY_INSERT bookings OFF;

INSERT INTO booking_seats (booking_id, showtime_id, seat_label) VALUES
  (1, 5, N'F6'),
  (1, 5, N'F7'),
  (2, 7, N'E5'),
  (2, 7, N'E6'),
  (2, 7, N'E7'),
  (3, 5, N'D8'),
  (3, 5, N'D9'),
  (3, 5, N'E3'),
  (3, 5, N'E4'),
  (3, 5, N'E5'),
  (3, 5, N'G10'),
  (4, 5, N'B1'),
  (4, 5, N'B2'),
  (4, 5, N'C11'),
  (4, 5, N'C12'),
  (5, 6, N'A1'),
  (5, 6, N'A2'),
  (6, 9, N'A1'),
  (6, 9, N'A2'),
  (6, 9, N'A3'),
  (7, 8, N'C4'),
  (7, 8, N'C5'),
  (8, 11, N'D5'),
  (8, 11, N'D6'),
  (8, 11, N'D7'),
  (8, 11, N'D8'),
  (9, 14, N'E5'),
  (9, 14, N'E6'),
  (10, 17, N'A1'),
  (10, 17, N'A2'),
  (10, 17, N'B1'),
  (10, 17, N'B2'),
  (11, 1, N'E5'),
  (11, 1, N'E6'),
  (12, 2, N'D4'),
  (12, 2, N'D5'),
  (12, 2, N'D6'),
  (13, 3, N'F6'),
  (13, 3, N'F7'),
  (13, 3, N'F8'),
  (14, 4, N'C3');

SET IDENTITY_INSERT contacts ON;
INSERT INTO contacts (id, name, email, message, created_at) VALUES
  (1, N'Trần Thị B', N'b@example.com', N'Rạp có chương trình giảm giá cho sinh viên không ạ?', CONVERT(varchar(19), DATEADD(day, 0, SYSDATETIME()), 120)),
  (2, N'Nguyễn Văn C', N'c@example.com', N'Cho mình hỏi rạp có chỗ gửi xe máy miễn phí không?', CONVERT(varchar(19), DATEADD(day, -1, SYSDATETIME()), 120)),
  (3, N'Lê Hoàng D', N'd@example.com', N'Mình muốn đặt cả phòng VIP cho sinh nhật 20 người, liên hệ thế nào?', CONVERT(varchar(19), DATEADD(day, -2, SYSDATETIME()), 120)),
  (4, N'Phạm Thu E', N'e@example.com', N'Suất 22h phim Kinh dị đêm khuya có cho trẻ em đi cùng không?', CONVERT(varchar(19), DATEADD(day, -3, SYSDATETIME()), 120)),
  (5, N'Võ Minh F', N'f@example.com', N'Ghế ở phòng IMAX rất thoải mái, cảm ơn rạp!', CONVERT(varchar(19), DATEADD(day, -5, SYSDATETIME()), 120));
SET IDENTITY_INSERT contacts OFF;

COMMIT;
GO
