const supabase = require('../../auth/supabase');

// GET /api/papers/[id] - 获取论文详情
// PUT /api/papers/[id] - 更新论文（需认证，只能改自己的）
// DELETE /api/papers/[id] - 删除论文（需认证，只能删自己的）
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query.id || req.url.split('/').pop();

  // GET - 获取论文详情
  if (req.method === 'GET') {
    try {
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
  }

  // 认证检查（用于 PUT 和 DELETE）
  if (req.method === 'PUT' || req.method === 'DELETE') {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: '请先登录' });
    }
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const userId = decoded.userId;

    // 检查论文是否存在且属于当前用户
    const { data: existing } = await supabase
      .from('papers')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: '论文不存在' });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ error: '无权操作此论文' });
    }
  }

  // PUT - 更新论文
  if (req.method === 'PUT') {
    try {
      const { title, description, tags } = req.body || {};

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
  }

  // DELETE - 删除论文
  if (req.method === 'DELETE') {
    try {
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
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
