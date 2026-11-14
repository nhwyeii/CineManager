(() => {
  const dauTrang = document.getElementById('dau-trang');
  const chanTrang = document.getElementById('chan-trang');
  const toast = document.getElementById('toast');
  const goc = document.documentElement;
  let henGio;

  dauTrang.innerHTML = `
    <div class="thanh">
      <strong><a href="/">CineManager</a></strong>
      <nav aria-label="Điều hướng chính">
        <a href="/#noi-dung">Danh sách phim</a>
        <button id="doi-giao-dien" type="button" aria-pressed="false">
          Chế độ tối
        </button>
      </nav>
    </div>
  `;

  chanTrang.innerHTML = `
    <div class="thanh">
      <span>CineManager</span>
      <a href="#dau-trang">Lên đầu trang</a>
    </div>
  `;

  const nutDoi = document.getElementById('doi-giao-dien');
  let cheDo = 'light';

  try {
    if (localStorage.getItem('cine-theme') === 'dark') cheDo = 'dark';
  } catch {
    // Dùng chế độ sáng khi trình duyệt chặn bộ nhớ cục bộ.
  }

  function apDungCheDo() {
    goc.dataset.theme = cheDo;
    nutDoi.setAttribute('aria-pressed', String(cheDo === 'dark'));
  }

  apDungCheDo();

  nutDoi.addEventListener('click', () => {
    cheDo = cheDo === 'dark' ? 'light' : 'dark';
    apDungCheDo();

    try {
      localStorage.setItem('cine-theme', cheDo);
    } catch {
      // Tùy chọn vẫn có hiệu lực trên trang đang mở.
    }

    clearTimeout(henGio);
    toast.textContent = cheDo === 'dark'
      ? 'Đã bật chế độ tối.'
      : 'Đã bật chế độ sáng.';

    henGio = setTimeout(() => {
      toast.textContent = '';
    }, 3000);
  });
})();