// Gọi RESTful API của backend bằng fetch
class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors || null; // lỗi theo từng trường: { field: 'message' }
  }
}

const Api = (function () {
  async function request(method, url, body) {
    const opt = { method: method, headers: {}, credentials: 'same-origin' };
    if (body !== undefined) {
      opt.headers['Content-Type'] = 'application/json';
      opt.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch(url, opt);
    } catch (e) {
      throw new ApiError(0, 'Không kết nối được máy chủ. Hãy kiểm tra server đã chạy (npm start) chưa.');
    }
    let data = null;
    try { data = await res.json(); } catch (e) { /* không có body */ }
    if (!res.ok) {
      throw new ApiError(res.status, (data && data.message) || 'Có lỗi xảy ra (mã ' + res.status + ').', data && data.errors);
    }
    return data;
  }

  function qs(params) {
    const p = new URLSearchParams();
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] !== '' && params[k] != null && params[k] !== 'all') p.set(k, params[k]);
    });
    const s = p.toString();
    return s ? '?' + s : '';
  }

  return {
    get: function (url, params) { return request('GET', url + qs(params)); },
    post: function (url, body) { return request('POST', url, body || {}); },
    put: function (url, body) { return request('PUT', url, body || {}); },
    del: function (url) { return request('DELETE', url); }
  };
})();
