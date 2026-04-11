const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://wkgpyneafghqykiciyxg.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZ3B5bmVhZmdocXlraWNpeXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjczNzEsImV4cCI6MjA5MTUwMzM3MX0.zTPkPVOzK-MtgaMAkdKS6gnKiI9OLJEMe0j1oUqRssw'
);

const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';

router.post('/register', async (req, res) => {
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

    // 创建用户信息
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

    res.json({
      token,
      user: { id: authData.user.id, username, institution: institution || '匿名学术难民' }
    });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/login', async (req, res) => {
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

    res.json({
      token,
      user: { id: authData.user.id, username: user.username, institution: user.institution }
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
