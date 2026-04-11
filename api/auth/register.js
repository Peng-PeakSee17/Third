const supabase = require('./supabase');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, institution } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码必填' });
  }

  try {
    // Supabase Auth: 注册用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${username}@academic.local`,
      password: password,
    });

    if (authError) {
      if (authError.message.includes('already')) {
        return res.status(409).json({ error: '用户名已存在' });
      }
      return res.status(400).json({ error: authError.message });
    }

    // 在 users 表中创建用户信息
    const { error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          username: username,
          institution: institution || '匿名学术难民',
          favorites: [],
          created_at: new Date().toISOString()
        }
      ]);

    if (dbError) {
      console.error('创建用户信息失败:', dbError);
    }

    const token = jwt.sign(
      { userId: authData.user.id, username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: authData.user.id,
        username: username,
        institution: institution || '匿名学术难民'
      }
    });
  } catch (err) {
    console.error('注册错误:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};
