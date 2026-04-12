const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://wkgpyneafghqykiciyxg.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZ3B5bmVhZmdocXlraWNpeXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjczNzEsImV4cCI6MjA5MTUwMzM3MX0.zTPkPVOzK-MtgaMAkdKS6gnKiI9OLJEMe0j1oUqRssw'
);

const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';

// 统一认证中间件
async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.user = { id: decoded.userId, username: decoded.username };
    next();
  } catch {
    return res.status(401).json({ error: 'Token 无效' });
  }
}

// GET /api/user/profile - 获取当前用户信息
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, institution, favorites, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 获取用户上传的论文数量
    const { count } = await supabase
      .from('papers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    return res.status(200).json({
      user: { ...user, paperCount: count || 0 }
    });
  } catch (e) {
    console.error('获取用户信息错误:', e);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

// GET /api/user/favorites - 获取收藏列表
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('favorites')
      .eq('id', req.user.id)
      .single();

    if (error || !userData) {
      return res.status(200).json({ papers: [], favoriteIds: [] });
    }

    const favoriteIds = userData.favorites || [];

    if (favoriteIds.length === 0) {
      return res.status(200).json({ papers: [], favoriteIds: [] });
    }

    const { data: papers } = await supabase
      .from('papers')
      .select('*')
      .in('id', favoriteIds);

    return res.status(200).json({ papers: papers || [], favoriteIds });
  } catch (e) {
    console.error('获取收藏失败:', e);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

// POST /api/user/favorite/:paperId - 收藏/取消收藏论文
router.post('/favorite/:paperId', authMiddleware, async (req, res) => {
  try {
    const { paperId } = req.params;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('favorites')
      .eq('id', req.user.id)
      .single();

    if (userError) {
      console.error('获取收藏列表失败:', userError);
      return res.status(500).json({ error: '操作失败' });
    }

    const favorites = userData?.favorites || [];
    const isFavorited = favorites.includes(paperId);

    let newFavorites;
    if (isFavorited) {
      newFavorites = favorites.filter(id => id !== paperId);
    } else {
      newFavorites = [...favorites, paperId];
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ favorites: newFavorites })
      .eq('id', req.user.id);

    if (updateError) {
      console.error('更新收藏失败:', updateError);
      return res.status(500).json({ error: '操作失败' });
    }

    return res.status(200).json({ isFavorited: !isFavorited, favoriteIds: newFavorites });
  } catch (e) {
    console.error('收藏操作错误:', e);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
