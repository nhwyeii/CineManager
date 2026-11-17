# Làm việc với Git trong CineManager

Repo của nhóm là https://github.com/nhwyeii/CineManager.

## Lấy dự án

```bash
git clone https://github.com/nhwyeii/CineManager.git
cd CineManager
git switch main
git pull --ff-only origin main
npm start
```

Bản hiện tại dùng Node.js 22.13 trở lên và SQLite. Xem các lệnh chạy và tài khoản mẫu trong [README.md](README.md).

## Cập nhật code trên nhánh riêng

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/ten-chuc-nang
```

Sau khi sửa, chạy `npm test`, xem `git status` và dùng `git add` với các file thuộc phần đã làm. Tạo commit bằng tên và email GitHub của mình. Đẩy nhánh rồi tạo Pull Request vào `main`.

```bash
git add <file-da-sua>
git commit -m "feat: mo ta thay doi"
git push -u origin HEAD
```

Giữ `.env`, `node_modules/` và các file SQLite cá nhân bên ngoài commit. Mỗi bạn kiểm thử và trình bày phần mình phụ trách theo [bảng phân công](HUONG_DAN.md#8-phan-cong).
