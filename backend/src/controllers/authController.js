// Controller: đăng ký, đăng nhập, đăng xuất, hồ sơ, đổi mật khẩu
const security = require('../utils/security');
const v = require('../utils/validate');
const {
  HttpError
} = require('../utils/http');
const {
  validationFail,
  dbError,
  hasErrors
} = require('../utils/text');
const {
  transaction
} = require('../db');
const userModel = require('../models/userModel');
const sessionModel = require('../models/sessionModel');
const {
  withPermissions
} = require('../middlewares/auth');
async function startSession(userId) {
  const t = security.newToken();
  await sessionModel.create(t.hash, userId, t.expires);
  return security.cookieHeader(t.token, t.maxAge);
}

// Chống dò mật khẩu: sai 5 lần trong 10 phút thì khóa tạm
const attempts = new Map();
function checkLoginLimit(key) {
  const a = attempts.get(key);
  if (a && a.count >= 5 && a.until > Date.now()) throw new HttpError(429, 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 10 phút.');
}
function loginFailed(key) {
  const a = attempts.get(key);
  if (!a || a.until < Date.now()) attempts.set(key, {
    count: 1,
    until: Date.now() + 600000
  });else a.count++;
}
exports.register = async ({
  body
}) => {
  const {
    errors,
    data
  } = v.register(body);
  if (hasErrors(errors)) throw validationFail(errors);
  let id;
  try {
    // Luôn tạo vai trò 'customer', bỏ qua mọi giá trị role do client gửi
    id = await userModel.create({
      ...data,
      password_hash: security.hashPassword(data.password),
      role: 'customer'
    });
  } catch (err) {
    if ([2601, 2627].includes(err.number) && /username/i.test(err.message)) throw new HttpError(409, 'Tên đăng nhập đã tồn tại.', {
      username: 'Tên đăng nhập đã tồn tại.'
    });
    if ([2601, 2627].includes(err.number) && /email/i.test(err.message)) throw new HttpError(409, 'Email đã được sử dụng.', {
      email: 'Email đã được sử dụng.'
    });
    throw err;
  }
  return {
    status: 201,
    cookie: await startSession(id),
    data: {
      message: 'Đăng ký thành công!',
      user: withPermissions(await userModel.findPublicById(id))
    }
  };
};
exports.login = async ({
  body,
  req
}) => {
  const username = v.str(body.username);
  const key = (req.socket.remoteAddress || '') + '|' + username.toLowerCase();
  checkLoginLimit(key);
  const row = username ? await userModel.findByLogin(username) : null;
  if (!row || !security.verifyPassword(String(body.password || ''), row.password_hash)) {
    loginFailed(key);
    throw new HttpError(401, 'Sai tên đăng nhập hoặc mật khẩu.');
  }
  attempts.delete(key);
  return {
    cookie: await startSession(row.id),
    data: {
      message: 'Đăng nhập thành công!',
      user: withPermissions(await userModel.findPublicById(row.id))
    }
  };
};
exports.logout = async ({
  req
}) => {
  const token = security.parseCookies(req).sid;
  if (token) await sessionModel.remove(security.sha256(token));
  return {
    cookie: security.cookieHeader('', 0),
    data: {
      message: 'Đã đăng xuất.'
    }
  };
};
exports.me = ({
  user
}) => ({
  data: {
    user: withPermissions(user)
  }
});
exports.updateProfile = async ({
  body,
  user
}) => {
  const {
    errors,
    data
  } = v.profile(body);
  if (hasErrors(errors)) throw validationFail(errors);
  try {
    await userModel.updateProfile(user.id, data);
  } catch (err) {
    throw dbError(err, {
      unique: {
        'users.email': 'Email đã được sử dụng.'
      }
    });
  }
  return {
    data: {
      message: 'Đã cập nhật thông tin cá nhân.',
      user: withPermissions(await userModel.findPublicById(user.id))
    }
  };
};
exports.changePassword = async ({
  body,
  user,
  req
}) => {
  const errors = {};
  if (!security.verifyPassword(String(body.current_password || ''), await userModel.getPasswordHash(user.id))) errors.current_password = 'Mật khẩu hiện tại không đúng.';
  const pe = v.password(body.new_password);
  if (pe) errors.new_password = pe;
  if (hasErrors(errors)) throw validationFail(errors);
  await transaction(async () => {
    await userModel.updatePassword(user.id, security.hashPassword(body.new_password));
    // Đăng xuất các thiết bị khác, giữ phiên hiện tại
    await sessionModel.removeOthers(user.id, security.sha256(security.parseCookies(req).sid || ''));
  });
  return {
    data: {
      message: 'Đã đổi mật khẩu.'
    }
  };
};
