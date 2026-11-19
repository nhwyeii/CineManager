// Controller: thống kê
const statsModel = require('../models/statsModel');
const {
  can
} = require('../middlewares/auth');
exports.get = async ({
  user
}) => {
  const stats = await statsModel.summary();
  if (!can(user, 'stats:revenue')) delete stats.revenue; // doanh thu chỉ Quản lý xem
  return {
    data: stats
  };
};
