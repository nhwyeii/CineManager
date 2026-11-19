// Trang đăng nhập / đăng ký
(function () {
  // Chỉ cho phép chuyển hướng về trang nội bộ (chống open redirect)
  function nextUrl() {
    const n = new URLSearchParams(location.search).get('next') || '';
    return /^[a-z0-9\-]+\.html(\?[\w=&%\-.]*)?$/i.test(n) ? n : 'index.html';
  }

  async function init() {
    const user = await App.init();
    if (user) { location.replace(nextUrl()); return; }

    const login = document.getElementById('loginForm');
    if (login) {
      App.bindForm(login, Validation.rules.login, async function (data) {
        await Api.post('/api/auth/login', { username: data.username, password: data.password });
        location.href = nextUrl();
      });
    }

    const reg = document.getElementById('registerForm');
    if (reg) {
      App.bindForm(reg, Validation.rules.register, async function (data) {
        await Api.post('/api/auth/register', {
          username: data.username, email: data.email, full_name: data.full_name, phone: data.phone, password: data.password
        });
        location.href = 'index.html';
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
