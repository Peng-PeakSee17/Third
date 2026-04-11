const { getPosts, getUserFavorites } = require('../../store');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' });
    }
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const userId = decoded.userId;

    // Get user's favorite post IDs from Redis
    const favoriteIds = await getUserFavorites(userId);
    
    // Get all posts and filter by favorites
    const allPosts = await getPosts();
    const favorites = allPosts.filter(p => favoriteIds.includes(p.id));
    
    return res.status(200).json({ posts: favorites, favoriteIds });
  } catch (e) {
    console.error('获取收藏失败:', e);
    return res.status(401).json({ error: 'Token 无效' });
  }
};
