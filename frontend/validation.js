function kiemTraTaiKhoan(duLieu, dangKy) {
  if (!/^[a-zA-Z0-9_]{3,50}$/.test(duLieu.ten_dang_nhap.trim())) {
    return 'Tên đăng nhập cần 3–50 ký tự chữ, số hoặc dấu _.';
  }

  if (dangKy && (!duLieu.ho_ten.trim() || duLieu.ho_ten.trim().length > 100)) {
    return 'Nhập họ tên tối đa 100 ký tự.';
  }

  if (duLieu.mat_khau.length < 8 || duLieu.mat_khau.length > 128) {
    return 'Mật khẩu cần từ 8 đến 128 ký tự.';
  }

  return '';
}