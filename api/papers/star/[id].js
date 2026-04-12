const supabase = require('../../../auth/supabase');

// POST /api/papers/star/[id] - 点赞/取消点赞论文
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: '请先登录' });
    }
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const userId = decoded.userId;

    const id = req.query.id || req.url.split('/').pop();

    // 获取论文
    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('stars, starred_by')
      .eq('id', id)
      .single();

    if (fetchError || !paper) {
      return res.status(404).json({ error: '论文不存在' });
    }

    // 点赞列表
    const starredBy = paper.starred_by || [];
    const hasStarred = starredBy.includes(userId);

    let newStars, newStarredBy;

    if (hasStarred) {
      // 取消点赞
      newStars = (paper.stars || 1) - 1;
      newStarredBy = starredBy.filter(uid => uid !== userId);
    } else {
      // 点赞
      newStars = (paper.stars || 0) + 1;
      newStarredBy = [...starredBy, userId];
    }

    // 更新
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
};
