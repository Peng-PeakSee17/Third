const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Supabase client
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

// GET /api/papers - 获取论文列表
router.get('/', async (req, res) => {
  try {
    const { tab, search, tag, author } = req.query;

    // author=me: 获取当前用户的论文
    if (author === 'me') {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: '请先登录' });
      }
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
        const userId = decoded.userId;

        const { data, error } = await supabase
          .from('papers')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('获取我的论文失败:', error);
          return res.status(500).json({ error: '获取论文列表失败' });
        }
        return res.status(200).json({ papers: data || [] });
      } catch {
        return res.status(401).json({ error: 'Token 无效' });
      }
    }

    let query = supabase
      .from('papers')
      .select('*')
      .order('created_at', { ascending: false });

    if (tab === 'hot') {
      query = supabase
        .from('papers')
        .select('*')
        .order('stars', { ascending: false })
        .order('views', { ascending: false });
    }

    if (search) {
      query = supabase
        .from('papers')
        .select('*')
        .or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (tag) {
      query = supabase
        .from('papers')
        .select('*')
        .contains('tags', [tag]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取论文列表失败:', error);
      return res.status(500).json({ error: '获取论文列表失败' });
    }

    return res.status(200).json({ papers: data || [] });
  } catch (e) {
    console.error('获取论文列表错误:', e);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

// POST /api/papers - 创建论文
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, tags, fileUrl, institution } = req.body || {};

    if (!title) {
      return res.status(400).json({ error: '标题必填' });
    }

    const { data, error } = await supabase
      .from('papers')
      .insert([
        {
          user_id: req.user.id,
          title,
          description: description || '',
          tags: tags || [],
          file_url: fileUrl || '',
          institution: institution || '匿名学术难民',
          stars: 0,
          views: 0,
          starred_by: []
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('创建论文失败:', error);
      return res.status(500).json({ error: '创建论文失败' });
    }

    return res.status(200).json({ paper: data });
  } catch (e) {
    console.error('创建论文错误:', e);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

// GET /api/papers/:id - 获取论文详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('papers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: '论文不存在' });
    }

    // 增加阅读数
    await supabase
      .from('papers')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', id);

    return res.status(200).json({ paper: data });
  } catch (e) {
    console.error('获取论文详情错误:', e);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

// PUT /api/papers/:id - 更新论文
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags } = req.body || {};

    // 检查权限
    const { data: existing } = await supabase
      .from('papers')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: '论文不存在' });
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: '无权操作此论文' });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (tags) updates.tags = tags;

    const { data, error } = await supabase
      .from('papers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新论文失败:', error);
      return res.status(500).json({ error: '更新论文失败' });
    }

    return res.status(200).json({ paper: data });
  } catch (e) {
    console.error('更新论文错误:', e);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

// DELETE /api/papers/:id - 删除论文
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查权限
    const { data: existing } = await supabase
      .from('papers')
      .select('user_id, file_url')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: '论文不存在' });
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: '无权操作此论文' });
    }

    // 删除关联文件
    if (existing.file_url) {
      const fileName = existing.file_url.replace('/api/files/', '');
      const filePath = path.join(__dirname, '..', 'uploads', fileName);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.error('删除文件失败:', fileErr);
      }
    }

    const { error } = await supabase
      .from('papers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除论文失败:', error);
      return res.status(500).json({ error: '删除论文失败' });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('删除论文错误:', e);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

// POST /api/papers/:id/star - 点赞/取消点赞
router.post('/:id/star', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('stars, starred_by')
      .eq('id', id)
      .single();

    if (fetchError || !paper) {
      return res.status(404).json({ error: '论文不存在' });
    }

    const starredBy = paper.starred_by || [];
    const hasStarred = starredBy.includes(req.user.id);

    let newStars, newStarredBy;

    if (hasStarred) {
      newStars = Math.max(0, (paper.stars || 1) - 1);
      newStarredBy = starredBy.filter(uid => uid !== req.user.id);
    } else {
      newStars = (paper.stars || 0) + 1;
      newStarredBy = [...starredBy, req.user.id];
    }

    const { data, error } = await supabase
      .from('papers')
      .update({ stars: newStars, starred_by: newStarredBy })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('点赞失败:', error);
      return res.status(500).json({ error: '点赞失败' });
    }

    return res.status(200).json({
      stars: data.stars,
      isStarred: !hasStarred
    });
  } catch (e) {
    console.error('点赞错误:', e);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
