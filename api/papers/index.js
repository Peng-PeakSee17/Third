const supabase = require('../auth/supabase');

// GET /api/papers - 获取论文列表
// POST /api/papers - 创建论文（需认证）
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET - 获取论文列表
  if (req.method === 'GET') {
    try {
      const { tab, search, tag } = req.query;
      let query = supabase
        .from('papers')
        .select('*')
        .order('created_at', { ascending: false });

      // 热门排序
      if (tab === 'hot') {
        query = supabase
          .from('papers')
          .select('*')
          .order('stars', { ascending: false })
          .order('views', { ascending: false });
      }

      // 搜索
      if (search) {
        query = supabase
          .from('papers')
          .select('*')
          .or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // 标签筛选
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
  }

  // POST - 创建论文
  if (req.method === 'POST') {
    try {
      // 验证认证
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: '请先登录' });
      }
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';
      const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
      const userId = decoded.userId;

      const { title, description, tags, fileUrl, institution } = req.body || {};

      if (!title) {
        return res.status(400).json({ error: '标题必填' });
      }

      if (!fileUrl) {
        return res.status(400).json({ error: '请先上传论文文件' });
      }

      const { data, error } = await supabase
        .from('papers')
        .insert([
          {
            user_id: userId,
            title,
            description: description || '',
            tags: tags || [],
            file_url: fileUrl,
            institution: institution || '匿名学术难民',
            stars: 0,
            views: 0
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
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
