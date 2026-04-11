const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getPosts, getUserById } = require('../data/store');

const router = express.Router();

// Get user's favorites
router.get('/favorites', authMiddleware, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  const allPosts = getPosts();
  const favorites = allPosts.filter(p => (p.favorites || []).includes(req.user.id));
  res.json({ posts: favorites });
});

module.exports = router;
