const crypto = require('crypto');

const AUTH_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const AUTH_PASSWORD = process.env.ADMIN_PASSWORD || 'kiethost@123';
const AUTH_SECRET = process.env.AUTH_SECRET || 'scheduleai_secret_salt_2026_super_secure';

/**
 * Tạo token đăng nhập có chữ ký HMAC (thời hạn 30 ngày)
 */
function generateToken(username) {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const payload = `${username}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

/**
 * Xác thực token
 */
function verifyToken(token) {
  try {
    if (!token) return false;
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [username, expiresAtStr, signature] = decoded.split(':');
    if (!username || !expiresAtStr || !signature) return false;

    if (Date.now() > parseInt(expiresAtStr, 10)) return false;

    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(`${username}:${expiresAtStr}`).digest('hex');
    if (signature !== expectedSig) return false;

    return { username };
  } catch (err) {
    return false;
  }
}

/**
 * Middleware bảo vệ các API nhạy cảm (Settings, Events, Tasks, Recurring)
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Yêu cầu đăng nhập để truy cập tài nguyên.' });
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.' });
  }

  req.user = user;
  next();
}

module.exports = {
  AUTH_USERNAME,
  AUTH_PASSWORD,
  generateToken,
  verifyToken,
  requireAuth
};
