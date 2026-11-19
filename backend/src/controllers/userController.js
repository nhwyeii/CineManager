// Controller: quản lý người dùng (Quản lý)
const userModel = require('../models/userModel');
const {
  HttpError
} = require('../utils/http');
const {
  validationFail,
  needId
} = require('../utils/text');
exports.list = async () => ({
  data: {
    items: await userModel.list()
  }
});
exports.changeRole = async ({
  params,
  body,
  user
}) => {
  const id = needId(params);
  if (!['customer', 'staff', 'manager'].includes(body.role)) throw validationFail({
    role: 'Vai trò không hợp lệ.'
  });
  if (id === user.id) throw new HttpError(403, 'Bạn không thể tự đổi vai trò của chính mình.');
  if (!(await userModel.updateRole(id, body.role))) throw new HttpError(404, 'Không tìm thấy người dùng.');
  return {
    data: {
      message: 'Đã đổi vai trò người dùng.'
    }
  };
};
