const mauTen = /^[a-z0-9_]{3,50}$/;

function chuanHoaTen(ten) {
  return typeof ten === 'string' ? ten.trim().toLowerCase() : '';
}

function matKhauHopLe(matKhau) {
  return typeof matKhau === 'string'
    && matKhau.length >= 8
    && matKhau.length <= 128;
}

module.exports = { mauTen, chuanHoaTen, matKhauHopLe };