const express = require('express');
const router = express.Router();
const { AUTH_USERNAME, AUTH_PASSWORD, generateToken, requireAuth } = require('../middleware/auth');

// Đăng nhập
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' });
  }

  if (username.trim() === AUTH_USERNAME && password === AUTH_PASSWORD) {
    const token = generateToken(AUTH_USERNAME);
    return res.json({
      success: true,
      token,
      user: { username: AUTH_USERNAME }
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Tên đăng nhập hoặc mật khẩu không chính xác!'
  });
});

// Xác thực phiên đăng nhập hiện tại
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
