// Controller: thống kê
const statsModel = require('../models/statsModel');
const { can } = require('../middlewares/auth');

exports.get = ({ user }) => {
  const stats = statsModel.summary();
  if (!can(user, 'stats:revenue')) delete stats.revenue; // doanh thu chỉ Quản lý xem
  return { data: stats };
};
