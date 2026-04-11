const supabase = require('./supabase');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码必填' });
  }

  try {
    // Supabase Auth: 登录
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: `${username}@academic.local`,
      password: password,
    });

    if (authError) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 获取用户信息
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    const user = userData || {
      id: authData.user.id,
      username: username,
      institution: '匿名学术难民'
    };

    const token = jwt.sign(
      { userId: authData.user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: authData.user.id,
        username: user.username,
        institution: user.institution
      }
    });
  } catch (err) {
    console.error('登录错误:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};
