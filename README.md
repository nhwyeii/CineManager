# CineManager - Web đặt vé xem phim & quản lý rạp chiếu phim

Bài tập lớn môn Phát triển ứng dụng Web (PROG2008) - ĐH CMC.
Node.js (backend + RESTful API) + SQLite (CSDL) + HTML/CSS/JavaScript/Bootstrap (frontend).

## Chạy nhanh

Cần Node.js 22.13 trở lên. Máy chủ tạo dữ liệu mẫu khi khởi động lần đầu. Bản này dùng SQLite. Dữ liệu từ bản SQL Server cần được chuyển riêng nếu muốn dùng tiếp.

```bash
node -v        # cần >= 22.13
npm start      # mở http://localhost:3000
npm test       # chạy bộ kiểm thử API
npm run seed   # xóa và tạo lại dữ liệu mẫu
```
Tài khoản mẫu:

| Vai trò | Tài khoản | Mật khẩu |
|---|---|---|
| Quản lý | `quanly` | `Quanly@123` |
| Nhân viên | `nhanvien1`, `nhanvien2` | `Nhanvien@123` |
| Khách hàng | `khach`, `lan`, `minh`, `hoa` | `Khach@123` |

Khách vãng lai (chưa đăng nhập) chỉ xem được nội dung công khai. Trang Liên hệ chỉ dành cho khách / khách hàng (quản lý thấy trang Thống kê thay thế, nhân viên không có); thống kê chỉ Quản lý xem; thêm phim có chọn ảnh poster từ máy; "Vé của tôi" chỉ có ở Khách hàng; bán vé tại quầy phải nhập số điện thoại khách. Ma trận quyền đầy đủ: [HUONG_DAN.md](HUONG_DAN.md) và `database/permissions.sql`.
Khi cập nhật bản poster, giữ lại file `database/cinema.db` đang dùng rồi khởi động lại bằng `npm start`. Máy chủ tự bổ sung ảnh cho các phim mẫu đang thiếu poster và giữ dữ liệu cũ. `npm run seed` chỉ dùng khi muốn xóa dữ liệu để tạo lại bộ mẫu.

Xem hướng dẫn đầy đủ trong [HUONG_DAN.md](HUONG_DAN.md) và cách dùng Git trong [GIT_HUONG_DAN.md](GIT_HUONG_DAN.md).

## Giao diện đặt vé (kiểu CGV / Galaxy)
| Trang | Chức năng |
|---|---|
| `index.html` | Banner phim nổi bật, **mua vé nhanh** (phim → ngày → suất), phim đang chiếu / sắp chiếu |
| `movies.html` | Danh sách phim dạng poster, tab Đang chiếu / Sắp chiếu, lọc thể loại, tìm không dấu |
| `movie.html?id=` | Chi tiết phim, chọn ngày, chọn suất chiếu theo phòng |
| `showtimes.html` | Lịch chiếu theo ngày, nhóm theo phim |
| `booking.html?showtime=` | **Sơ đồ ghế**: chọn tối đa 10 ghế, ghế VIP phụ thu 20%, chống bán trùng ghế |
| `profile.html#tickets` | **Vé của tôi**: vé điện tử có mã vé `CM000001`, ghế, hủy vé trước giờ chiếu |
| `admin.html` | Quản trị phim (poster, độ tuổi, ngày khởi chiếu), **suất chiếu**, phòng, người dùng, liên hệ, **vé & quầy vé** (hiển thị theo quyền: nhân viên thấy Suất chiếu (chỉ sửa), Vé, Liên hệ; quản lý thấy tất cả) |

Điểm mới ở backend: bảng `booking_seats` (UNIQUE theo suất + ghế), API `GET /api/showtimes/:id/seats`,
`GET /api/movies/:id`, đặt vé bằng `seat_labels`, lọc suất theo `date` / `upcoming=1`, phim có `state` (`showing` / `coming`).
CSDL cũ được tự nâng cấp khi khởi động (thêm cột cho `movies`, xếp ghế cho vé cũ). Chạy `npm run seed` để có dữ liệu mẫu mới (lịch chiếu 7 ngày).
## Thêm hoặc đổi poster phim

1. Đăng nhập bằng tài khoản Quản lý, mở **Quản trị → Phim**.
2. Bấm **Thêm phim** hoặc nút bút chì của phim cần sửa. Trong mục **Ảnh minh họa (poster)**, chọn JPG, PNG hoặc WebP từ máy (tối đa 8 MB), hoặc dán link ảnh HTTPS.
3. Kiểm tra ảnh xem trước rồi bấm **Lưu**. Trang chủ, danh sách phim, chi tiết phim và lịch chiếu dùng poster đã lưu. Nếu muốn bỏ ảnh, bấm **Bỏ ảnh** rồi **Lưu** để dùng khung minh họa tự động.

Poster của các phim mẫu là ảnh minh họa đi kèm dự án.


## Thêm suất chiếu và ảnh minh họa

Mở **Quản trị → Suất chiếu → Thêm suất**. Chọn phim có sẵn hoặc bấm **Thêm phim mới** ngay trong form để nhập tên, thể loại, thời lượng và poster. Khi lưu phim, hệ thống quay lại form suất chiếu, chọn sẵn phim mới và giữ các ô đã nhập. Chọn phòng, ngày, giờ và giá vé rồi lưu suất. Form hiển thị poster của phim ngay khi chọn. Nếu cần ảnh riêng cho suất, chọn ảnh từ máy hoặc dán link HTTPS. Nút **Dùng poster phim** bỏ ảnh riêng và quay về poster mặc định. Sau khi lưu, bảng quản trị mở trang chứa suất vừa thêm. Giữ file `database/cinema.db` để máy chủ tự bổ sung cột ảnh vào cơ sở dữ liệu đang dùng.
