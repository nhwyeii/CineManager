const formTaiKhoan = document.querySelector('form');
const thongBao = document.querySelector('#thong-bao');
const nutGui = formTaiKhoan.querySelector('button[type="submit"]');

formTaiKhoan.addEventListener('submit', async (event) => {
  event.preventDefault();

  const duLieu = Object.fromEntries(new FormData(formTaiKhoan));
  const dangKy = formTaiKhoan.dataset.api === 'dang-ky';
  const loiNhap = kiemTraTaiKhoan(duLieu, dangKy);

  if (loiNhap) {
    thongBao.textContent = loiNhap;
    return;
  }

  nutGui.disabled = true;
  thongBao.textContent = 'Đang xử lý…';

  try {
    const res = await fetch('/api/' + formTaiKhoan.dataset.api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duLieu)
    });

    const ketQua = await res.json();
    if (!res.ok) throw new Error(ketQua.thong_bao || 'Yêu cầu thất bại.');

    location.assign(dangKy ? '/login.html' : '/profile.html');
  } catch (loi) {
    thongBao.textContent = loi.message;
  } finally {
    nutGui.disabled = false;
  }
});