// Dùng cùng driver cho pool, request, transaction và các kiểu dữ liệu.
const config = require('./config');
module.exports = config.dbAuth === 'windows' ? require('mssql/msnodesqlv8') : require('mssql');
