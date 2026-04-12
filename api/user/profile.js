const supabase = require('../auth/supabase');

// GET /api/user/profile - 获取当前用户信息
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
      return res.status(401).json({ error: '请先登录' });
    }
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const userId = decoded.userId;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, institution, favorites, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 获取用户上传的论文数量
    const { count } = await supabase
      .from('papers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return res.status(200).json({
      user: {
        ...user,
        paperCount: count || 0
      }
    });
  } catch (e) {
    console.error('获取用户信息错误:', e);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};
