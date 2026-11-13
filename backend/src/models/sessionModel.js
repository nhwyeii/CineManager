const { randomBytes } = require('node:crypto');

const tenCookie = 'cine_session';
const thoiHan = 8 * 60 * 60 * 1000;
const tuyChonCookie = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/'
};

function layMaPhien(req) {
  return req.headers.cookie
    ?.match(/(?:^|;\s*)cine_session=([a-f0-9]{64})(?:;|$)/)?.[1];
}

function taoKhoPhien() {
  const danhSach = new Map();

  setInterval(() => {
    const hienTai = Date.now();
    for (const [ma, phien] of danhSach) {
      if (phien.hetHan <= hienTai) danhSach.delete(ma);
    }
  }, 60_000).unref();

  return {
    cap(req, res, ten) {
      danhSach.delete(layMaPhien(req));
      const ma = randomBytes(32).toString('hex');
      danhSach.set(ma, { ten, hetHan: Date.now() + thoiHan });
      res.cookie(tenCookie, ma, { ...tuyChonCookie, maxAge: thoiHan });
    },

    layTen(req) {
      const ma = layMaPhien(req);
      const phien = danhSach.get(ma);
      if (phien?.hetHan > Date.now()) return phien.ten;
      danhSach.delete(ma);
      return null;
    },

    huy(req, res) {
      danhSach.delete(layMaPhien(req));
      res.clearCookie(tenCookie, tuyChonCookie);
    }
  };
}

module.exports = { taoKhoPhien };