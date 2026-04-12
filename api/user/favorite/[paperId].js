const supabase = require('../../../auth/supabase');

// POST /api/user/favorite/[paperId] - 收藏/取消收藏论文
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

    const paperId = req.query.paperId || req.url.split('/').pop();

    // 获取用户当前收藏列表
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('favorites')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('获取收藏列表失败:', userError);
      return res.status(500).json({ error: '操作失败' });
    }

    const favorites = userData?.favorites || [];
    const isFavorited = favorites.includes(paperId);

    let newFavorites;
    if (isFavorited) {
      // 取消收藏
      newFavorites = favorites.filter(id => id !== paperId);
    } else {
      // 添加收藏
      newFavorites = [...favorites, paperId];
    }

    // 更新收藏列表
    const { error: updateError } = await supabase
      .from('users')
      .update({ favorites: newFavorites })
      .eq('id', userId);

    if (updateError) {
      console.error('更新收藏失败:', updateError);
      return res.status(500).json({ error: '操作失败' });
    }

    return res.status(200).json({
      isFavorited: !isFavorited,
      favoriteIds: newFavorites
    });
  } catch (e) {
    console.error('收藏操作错误:', e);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};
