// Đặt giao diện sáng/tối sớm (trong <head>) để tránh nháy trắng khi tải trang. Mặc định: tối.
try { document.documentElement.setAttribute('data-bs-theme', localStorage.getItem('cinema_theme') || 'dark'); } catch (e) { /* bỏ qua */ }
