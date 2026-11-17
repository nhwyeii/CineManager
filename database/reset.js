// Xóa toàn bộ dữ liệu và tạo lại dữ liệu mẫu:  npm run seed
const fs = require('fs');
const config = require('../backend/src/config');
for (const f of [config.dbFile, config.dbFile + '-wal', config.dbFile + '-shm']) {
  if (fs.existsSync(f)) fs.unlinkSync(f);
}
require('../backend/src/seed').seedIfEmpty();
console.log('Đã tạo lại CSDL và dữ liệu mẫu tại', config.dbFile);
