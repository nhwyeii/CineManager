# HƯỚNG DẪN GIT / GITHUB CHO NHÓM (5 người)

Repo của nhóm: https://github.com/nhwyeii/QlyRapChieu

Nguyên tắc: **main** luôn chạy được. Mỗi người làm trên **nhánh riêng**, xong thì tạo **Pull Request (PR)**, nhóm trưởng duyệt rồi mới gộp vào main. Commit dưới tên của chính mình để có bằng chứng đóng góp (CLO3, CLO5).

---

## PHẦN A. NHÓM TRƯỞNG làm trước (một lần)

### A1. Đưa code mới lên nhánh main

Làm trên máy của bạn, trong thư mục repo cũ (đã clone sẵn, ví dụ `PTW`).

```bash
# 1. Cập nhật và chuyển về main
git fetch origin
git checkout main
git pull origin main

# 2. Xóa file cũ nhưng GIỮ thư mục .git
#    (Windows PowerShell)
Get-ChildItem -Force | Where-Object { $_.Name -ne ".git" } | Remove-Item -Recurse -Force
#    (macOS / Linux)  find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +

# 3. Chép TOÀN BỘ nội dung trong thư mục CineManager (đã giải nén từ file zip) vào thư mục này
#    (chép các thư mục frontend, backend, database, docs, .vscode và các file .md, package.json, .gitignore)

# 4. Kiểm tra trước khi commit
git status
```

Trong `git status` **không được thấy**: `.env`, `database/cinema.db`, `node_modules`. Nếu thấy thì dừng lại, kiểm tra file `.gitignore`.

```bash
# 5. Commit và đẩy lên
git add -A
git commit -m "feat: nang cap thanh web dong (Node.js MVC + SQL Server), tach frontend/backend/database"
git push origin main
```

### A2. Mời 4 thành viên vào repo

GitHub → repo → **Settings** → **Collaborators** → **Add people** → nhập tên tài khoản GitHub từng người. Mỗi người phải bấm chấp nhận lời mời trong email.

### A3. Bật bảo vệ nhánh main (khuyến nghị)

Settings → **Branches** → **Add branch ruleset** (hoặc Add rule) cho `main`:
- Bật **Require a pull request before merging**.
- Bật **Require approvals** và chọn 1 (nhóm trưởng duyệt).
- (Nếu không thấy mục này do repo cá nhân bản miễn phí, bỏ qua; cả nhóm tự giữ quy tắc "không push thẳng vào main".)

### A4. Dọn các nhánh cũ (tùy chọn)

Các nhánh `feature/hy-filter`, `feature/diu-validation`... chứa code web tĩnh cũ, không khớp cấu trúc mới. Nên xóa trên GitHub (Branches → biểu tượng thùng rác) để không ai làm nhầm.

---

## PHẦN B. MỖI THÀNH VIÊN làm

### B1. Cài đặt một lần

Cài Git (https://git-scm.com) và Node.js bản 22.13 trở lên. Khai báo tên thật để commit hiện đúng người:

```bash
git config --global user.name "Ho Ten Cua Ban"
git config --global user.email "email-dung-de-dang-ky-github@gmail.com"
```

### B2. Lấy code và tạo nhánh của mình

```bash
git clone https://github.com/nhwyeii/QlyRapChieu.git
cd QlyRapChieu
git checkout -b feature/TEN-NHANH     # xem bảng bên dưới
npm start                              # kiểm tra chạy được: http://localhost:3000
```

| TV | Nhánh | Phần phụ trách |
|---|---|---|
| 1 (nhóm trưởng) | `feature/tv1-auth-db` | CSDL, đăng nhập, bảo mật |
| 2 | `feature/tv2-showtimes` | Suất chiếu |
| 3 | `feature/tv3-movie-room-booking` | Phim, phòng, đặt vé |
| 4 | `feature/tv4-stats-contact` | Thống kê, liên hệ, người dùng |
| 5 | `feature/tv5-ui-docs` | Giao diện chung, báo cáo, slide |

### B3. Vòng làm việc hằng ngày

```bash
# Trước khi làm: lấy cập nhật mới nhất từ main
git fetch origin
git merge origin/main

# Làm việc, rồi xem đã sửa gì
git status
git diff

# Lưu thành commit (commit nhỏ, thông điệp rõ)
git add backend/src/controllers/showtimeController.js
git commit -m "feat(showtime): bao loi khi trung phong va gio chieu"

# Đẩy nhánh của mình lên GitHub
git push -u origin feature/TEN-NHANH      # lần đầu
git push                                  # các lần sau
```

Quy ước thông điệp commit: `feat: ...` (thêm), `fix: ...` (sửa lỗi), `docs: ...` (tài liệu), `test: ...`, `style: ...`. Có thể viết tiếng Việt không dấu hoặc có dấu, miễn rõ nghĩa.

### B4. Tạo Pull Request

1. Sau khi `git push`, vào trang repo trên GitHub, bấm **Compare & pull request**.
2. Tiêu đề: ví dụ `[TV2] Hoan thien tim kiem va loc suat chieu`.
3. Mô tả ngắn: đã làm gì, cách kiểm tra.
4. Gán **Reviewer** là nhóm trưởng. Nhóm trưởng xem **Files changed**, góp ý hoặc **Approve**, rồi bấm **Merge pull request**.

Trước khi tạo PR, chạy `npm test`: phải thấy `pass 13`, `fail 0`.

### B5. Sau khi PR được gộp

```bash
git checkout main
git pull origin main
git checkout feature/TEN-NHANH
git merge main
```

---

## PHẦN C. Quy tắc nhóm

1. Không `git push` thẳng vào `main`. Không dùng `git push --force`.
2. Chỉ sửa file thuộc phần của mình (xem bảng phân công). Cần sửa file người khác thì nhắn họ.
3. Không commit: `.env`, `database/cinema.db`, `node_modules`. Kiểm tra `git status` trước mỗi lần `git add`.
4. Mỗi người có **ít nhất 5 commit thật** trên nhánh của mình, rải trong nhiều ngày (không dồn một lần).
5. Mỗi người tự sửa hoặc thêm ít nhất một chi tiết trong phần của mình (ví dụ đổi thông báo lỗi, thêm một ô lọc, chỉnh màu) để lịch sử Git phản ánh đúng đóng góp.

## PHẦN D. Xử lý sự cố thường gặp

| Tình huống | Cách xử lý |
|---|---|
| `git push` bị từ chối (rejected) | `git fetch origin`, `git merge origin/main`, giải quyết xung đột, rồi push lại |
| Xung đột (conflict) khi merge | Mở file có dấu `<<<<<<<`, giữ lại nội dung đúng, xóa các dấu, rồi `git add <file>` và `git commit` |
| Lỡ add nhầm `.env` hoặc `.db` | `git rm --cached .env` (hoặc tên file), commit lại; **không push** nếu chưa xóa |
| Lỡ commit nhầm file chưa push | `git reset --soft HEAD~1`, bỏ file ra khỏi `git add`, commit lại |
| Muốn bỏ thay đổi chưa commit của một file | `git restore <file>` |
| Quên mình đang ở nhánh nào | `git branch` (dấu `*` là nhánh hiện tại) |
| Báo lỗi xác thực khi push | Dùng Personal Access Token thay mật khẩu, hoặc đăng nhập bằng GitHub Desktop / VS Code (biểu tượng Source Control) |

## PHẦN E. Dùng Git trong VS Code

- Biểu tượng nhánh ở thanh bên trái (Source Control) cho phép xem thay đổi, nhập thông điệp commit, bấm dấu tick để commit và **Sync Changes** để push.
- Thanh dưới cùng bên trái hiển thị tên nhánh; bấm vào để tạo hoặc chuyển nhánh.
