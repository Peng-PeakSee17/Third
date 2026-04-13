const express = require('express');
const { getPosts, getPostById, addPost, toggleFavorite } = require('../data/store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all posts (with optional tab filter and search)
router.get('/', async (req, res) => {
  const { tab, search } = req.query;
  let posts = await getPosts();

  if (tab === 'hot') {
    posts = [...posts].sort((a, b) => (b.comments + b.stars * 2) - (a.comments + a.stars * 2));
  } else if (tab === 'favorite') {
    // handled at user level, return all for now
  }

  if (search) {
    const q = search.toLowerCase();
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q)
    );
  }

  res.json({ posts });
});

// Get single post
router.get('/:id', (req, res) => {
  const post = getPostById(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });
  res.json({ post });
});

// Create post (auth required)
router.post('/', authMiddleware, (req, res) => {
  const { title, content, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: '标题和内容必填' });
  }
  const post = {
    id: Date.now().toString(),
    title,
    content,
    tags: tags || [],
    author: req.user.username,
    authorId: req.user.id,
    institution: req.user.institution || '匿名学术难民',
    stars: 0,
    comments: 0,
    favorites: [],
    views: 0,
    createdAt: new Date().toISOString()
  };
  addPost(post);
  res.json({ post });
});

// Toggle favorite
router.post('/:id/favorite', authMiddleware, (req, res) => {
  const post = toggleFavorite(req.params.id, req.user.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });
  res.json({ favorites: post.favorites });
});

module.exports = router;
