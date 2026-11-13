const thongBao = document.querySelector('#thong-bao');
const nutThoat = document.querySelector('#dang-xuat');

async function taiHoSo() {
  const res = await fetch('/api/tai-khoan');

  if (res.status === 401) {
    location.replace('/login.html');
    return;
  }

  if (!res.ok) throw new Error('Không tải được hồ sơ.');

  const taiKhoan = await res.json();
  document.querySelector('#ho-ten').textContent = taiKhoan.ho_ten;
  document.querySelector('#ten-dang-nhap').textContent = taiKhoan.ten_dang_nhap;
  document.querySelector('#vai-tro').textContent =
    taiKhoan.vai_tro === 'quan_tri' ? 'Quản trị' : 'Khách hàng';
  nutThoat.hidden = false;
}

nutThoat.addEventListener('click', async () => {
  nutThoat.disabled = true;

  try {
    const res = await fetch('/api/dang-xuat', { method: 'POST' });
    if (!res.ok) throw new Error('Không đăng xuất được.');
    location.replace('/login.html');
  } catch (loi) {
    thongBao.textContent = loi.message;
    nutThoat.disabled = false;
  }
});

taiHoSo().catch((loi) => {
  thongBao.textContent = loi.message;
});