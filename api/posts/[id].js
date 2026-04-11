const { getPostById } = require('../store');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const post = getPostById(req.query.id || req.url.split('/').pop());
    if (!post) return res.status(404).json({ error: '文章不存在' });
    return res.status(200).json({ post });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
