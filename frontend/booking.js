const form = document.querySelector('#dat-ve');
const nutDat = form.querySelector('button');
const oSuat = form.elements.ma_suat_chieu;
const thongBao = document.querySelector('#thong-bao');
const trangThaiVe = document.querySelector('#trang-thai-ve');
const dinhDangGia = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const url = '/api/dat-ve';
let daDangNhap = false;

async function goiApi(path, options) {
  const res = await fetch(url + path, options);
  if (res.status === 204) return null;
  const data = await res.json();
  if (res.status === 401) {
    daDangNhap = false;
    nutDat.disabled = true;
  }
  if (!res.ok) throw new Error(data.thong_bao || 'Yêu cầu thất bại.');
  return data;
}

async function taiSuat() {
  const data = await goiApi('/suat');
  const options = data.filter((suat) => Number(suat.ghe_con_lai) > 0).map(
    (suat) => new Option(
      `${suat.ten_phim} · ${suat.ten_phong} · ${suat.gio_bat_dau} · ${dinhDangGia.format(suat.gia_ve)} · còn ${suat.ghe_con_lai} ghế`,
      suat.ma_suat_chieu
    )
  );
  oSuat.replaceChildren(new Option(options.length ? 'Chọn suất' : 'Không còn suất có ghế', ''), ...options);
  nutDat.disabled = !daDangNhap || !options.length;
}

async function taiVe() {
  const data = await goiApi('');
  daDangNhap = true;
  trangThaiVe.textContent = data.length ? '' : 'Bạn chưa đặt vé.';
  document.querySelector('#ve').replaceChildren(...data.map((ve) => {
    const li = document.createElement('li');
    const trangThai = ve.trang_thai === 'da_huy' ? 'Đã hủy' : 'Đã xác nhận';
    li.textContent = `#${ve.ma_dat_ve} · ${ve.ten_phim} · ${ve.gio_bat_dau} · ${ve.so_luong} vé · ${dinhDangGia.format(ve.don_gia_luc_dat * ve.so_luong)} · ${trangThai} `;
    if (ve.trang_thai === 'da_xac_nhan' && new Date(ve.gio_bat_dau.replace(' ', 'T')) > new Date()) {
      const nut = document.createElement('button');
      nut.textContent = 'Hủy vé';
      nut.onclick = async () => {
        if (!confirm('Hủy lượt đặt vé này?')) return;
        nut.disabled = true;
        try {
          await goiApi('/' + ve.ma_dat_ve + '/huy', { method: 'POST' });
          thongBao.textContent = 'Đã hủy vé.';
          await Promise.all([taiVe(), taiSuat()]);
        } catch (loi) {
          thongBao.textContent = loi.message;
        } finally {
          nut.disabled = false;
        }
      };
      li.append(nut);
    }
    return li;
  }));
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  nutDat.disabled = true;
  try {
    const data = await goiApi('', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    thongBao.textContent = 'Đặt vé thành công. Mã vé #' + data.ma_dat_ve;
    await Promise.all([taiVe(), taiSuat()]);
  } catch (loi) {
    thongBao.textContent = loi.message;
  } finally {
nutDat.disabled = !daDangNhap || oSuat.options.length < 2;
  }
});

async function khoiTao() {
  await taiVe().catch((loi) => { trangThaiVe.textContent = loi.message; });
  await taiSuat();
}
khoiTao().catch((loi) => { thongBao.textContent = loi.message; });