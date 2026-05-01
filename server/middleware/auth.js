const jwt = require('jsonwebtoken');

const JWT_SECRET = 'academic-waste-secret-2024';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId, username: decoded.username };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token 无效' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
