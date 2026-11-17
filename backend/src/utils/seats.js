// Sơ đồ ghế: sinh từ sức chứa của phòng (không cần bảng riêng).
// Hàng A, B, C... ; mỗi hàng có `cols` ghế; hàng giữa là ghế VIP (phụ thu 20% giá vé).
function colsFor(capacity) { return capacity <= 30 ? 6 : capacity <= 100 ? 10 : 12; }

function rowName(i) {
  const A = (n) => String.fromCharCode(65 + n);
  return i < 26 ? A(i) : A(Math.floor(i / 26) - 1) + A(i % 26);
}

function isVipRow(rowIndex, rowCount) {
  return rowCount >= 5 && rowIndex >= Math.floor(rowCount * 0.4) && rowIndex < rowCount - 1;
}

function layout(capacity) {
  const cols = colsFor(capacity);
  const rowCount = Math.ceil(capacity / cols);
  const rows = [];
  let left = capacity;
  for (let r = 0; r < rowCount; r++) {
    const vip = isVipRow(r, rowCount);
    const n = Math.min(cols, left);
    left -= n;
    const seats = [];
    for (let c = 1; c <= n; c++) seats.push({ label: rowName(r) + c, vip });
    rows.push({ name: rowName(r), vip, seats });
  }
  return { cols, rows };
}

const flat = (capacity) => layout(capacity).rows.flatMap((r) => r.seats);
const vipSurcharge = (price) => Math.round((price * 0.2) / 1000) * 1000;

// Tính tiền theo từng ghế (ghế VIP cộng phụ thu)
function totalPrice(labels, capacity, price) {
  const map = new Map(flat(capacity).map((s) => [s.label, s.vip]));
  return labels.reduce((sum, l) => sum + price + (map.get(l) ? vipSurcharge(price) : 0), 0);
}

// Sắp xếp A1, A2, A10, B1... đúng thứ tự tự nhiên
function sortLabels(labels) {
  const key = (l) => { const m = /^([A-Z]+)(\d+)$/.exec(l); return [m[1].length, m[1], Number(m[2])]; };
  return labels.slice().sort((a, b) => {
    const x = key(a), y = key(b);
    return x[0] - y[0] || (x[1] < y[1] ? -1 : x[1] > y[1] ? 1 : 0) || x[2] - y[2];
  });
}

module.exports = { layout, flat, vipSurcharge, totalPrice, sortLabels };
