const express = require('express');
const path = require('node:path');
const { ketNoiDatabase } = require('./src/db');

async function khoiDong() {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT phải là số nguyên từ 1 đến 65535.');
  }

  const pool = await ketNoiDatabase();
  const app = express();


  });
}

khoiDong().catch((loi) => {
  console.error('Không khởi động được backend:', loi.message);
  process.exitCode = 1;
});