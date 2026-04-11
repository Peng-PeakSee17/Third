const { getPosts, addPost } = require('../store');

// Helper to get auth user from header (async)
async function getAuthUser(req) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    return { id: decoded.userId, username: decoded.username };
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: '未登录' });

    const { title, content, tags } = req.body || {};
    if (!title || !content) return res.status(400).json({ error: '标题和内容必填' });

    const post = {
      id: Date.now().toString(),
      title, content,
      tags: tags || [],
      author: user.username,
      authorId: user.id,
      institution: user.institution || '匿名学术难民',
      stars: 0,
      comments: 0,
      favorites: [],
      views: 0,
      createdAt: new Date().toISOString()
    };
    await addPost(post);
    return res.status(200).json({ post });
  }

  if (req.method === 'GET') {
    const { tab, search } = req.query;
    let posts = await getPosts();

    if (tab === 'hot') {
      posts = [...posts].sort((a, b) => (b.comments + b.stars * 2) - (a.comments + a.stars * 2));
    }

    if (search) {
      const q = search.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({ posts });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
