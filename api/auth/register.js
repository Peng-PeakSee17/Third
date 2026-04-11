const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUserByUsername, addUser } = require('../store');

const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { username, password, institution } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码必填' });
    }
    const existing = getUserByUsername(username);
    if (existing) {
      return res.status(409).json({ error: '用户名已存在' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(),
      username,
      password: hashed,
      institution: institution || '匿名学术难民',
      favorites: [],
      createdAt: new Date().toISOString()
    };
    addUser(user);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({
      token,
      user: { id: user.id, username: user.username, institution: user.institution }
    });
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
