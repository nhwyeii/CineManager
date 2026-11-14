const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const taoKhoa = promisify(scrypt);
const mauBanBam = /^[a-f0-9]{32}:[a-f0-9]{128}$/;

async function taoMatKhauBam(matKhau) {
  const salt = randomBytes(16).toString('hex');
  const khoa = await taoKhoa(matKhau, salt, 64);
  return `${salt}:${khoa.toString('hex')}`;
}

async function dungMatKhau(matKhau, matKhauBam) {
  const hopLe = mauBanBam.test(matKhauBam || '');
  const [salt, hex] = hopLe
    ? matKhauBam.split(':')
    : ['0'.repeat(32), '0'.repeat(128)];

  const khoa = await taoKhoa(matKhau, salt, 64);
  return timingSafeEqual(khoa, Buffer.from(hex, 'hex')) && hopLe;
}

module.exports = { taoMatKhauBam, dungMatKhau };