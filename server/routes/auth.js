const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const { storeCode, verifyCode } = require('../data/verificationCodes');

const router = express.Router();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://wkgpyneafghqykiciyxg.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZ3B5bmVhZmdocXlraWNpeXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjczNzEsImV4cCI6MjA5MTUwMzM3MX0.zTPkPVOzK-MtgaMAkdKS6gnKiI9OLJEMe0j1oUqRssw'
);

const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/register', async (req, res) => {
  const { username, email, password, institution } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: '用户名、邮箱和密码必填' });
  }

  try {
    // Supabase Auth: 注册用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
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
          email,
          institution: institution || '匿名学术难民',
          favorites: [],
          created_at: new Date().toISOString()
        }
      ]);

    if (dbError) {
      console.error('创建用户信息失败:', dbError);
    }

    const token = jwt.sign(
      { userId: authData.user.id, username, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: authData.user.id, username, institution: institution || '匿名学术难民', email }
    });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码必填' });
  }

  try {
    // Supabase Auth: 登录
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: password,
    });

    if (authError) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 获取用户信息
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    const user = userData || {
      id: authData.user.id,
      username: email.split('@')[0],
      institution: '匿名学术难民'
    };

    const token = jwt.sign(
      { userId: authData.user.id, username: user.username, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: authData.user.id, username: user.username, institution: user.institution, email }
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// POST /auth/send-code
router.post('/send-code', async (req, res) => {
  const { username, email, password, institution } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: '用户名、邮箱和密码必填' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: '邮箱格式不正确' });
  }

  if (/[^\x00-\x7F]/.test(username)) {
    return res.status(400).json({ error: '用户名仅支持英文、数字和符号' });
  }

  try {
    // 检查用户名是否已存在（通过 Supabase Auth 的 email 映射）
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    // 检查邮箱是否已被使用
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return res.status(409).json({ error: '该邮箱已被注册' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const stored = storeCode(email, code, { username, email, password, institution });

    if (!stored) {
      return res.json({ message: '验证码已发送，请查看邮箱' });
    }

    await resend.emails.send({
      from: 'Third <noreply@pengpalm.cn>',
      to: email,
      subject: 'Third 注册验证码',
      html: `<p>你的验证码是：<strong style="font-size:24px;letter-spacing:4px">${code}</strong></p><p>5 分钟内有效。</p>`
    });

    res.json({ message: '验证码已发送' });
  } catch (err) {
    console.error('发送验证码错误:', err);
    res.status(500).json({ error: '发送验证码失败' });
  }
});

// POST /auth/verify-register
router.post('/verify-register', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: '邮箱和验证码必填' });
  }

  try {
    const payload = verifyCode(email, code);
    if (!payload) {
      return res.status(400).json({ error: '验证码无效或已过期' });
    }

    // Supabase Auth: 注册用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
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
          username: payload.username,
          email: payload.email,
          institution: payload.institution || '匿名学术难民',
          favorites: [],
          created_at: new Date().toISOString()
        }
      ]);

    if (dbError) {
      console.error('创建用户信息失败:', dbError);
    }

    const token = jwt.sign(
      { userId: authData.user.id, username: payload.username, email: payload.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: authData.user.id, username: payload.username, institution: payload.institution || '匿名学术难民', email: payload.email }
    });
  } catch (err) {
    console.error('验证注册错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
