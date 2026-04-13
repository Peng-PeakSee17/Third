const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { put } = require('@vercel/blob');

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const userRoutes = require('./routes/user');
const papersRoutes = require('./routes/papers');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://wkgpyneafghqykiciyxg.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZ3B5bmVhZmdocXlraWNpeXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjczNzEsImV4cCI6MjA5MTUwMzM3MX0.zTPkPVOzK-MtgaMAkdKS6gnKiI9OLJEMe0j1oUqRssw'
);

const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';

// 上传论文文件
app.post('/api/upload', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: '请先登录' });
    }
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const userId = decoded.userId;

    const { fileData, fileName, contentType, title, description, tags, institution } = req.body || {};

    if (!fileData) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    if (!title) {
      return res.status(400).json({ error: '标题必填' });
    }

    const buffer = Buffer.from(fileData, 'base64');
    const safeFileName = `${Date.now()}-${(fileName || 'paper').replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const blob = await put(safeFileName, buffer, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: contentType || 'application/octet-stream'
    });

    const { data: userData } = await supabase
      .from('users')
      .select('username, institution')
      .eq('id', userId)
      .single();

    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .insert([
        {
          user_id: userId,
          title,
          description: description || '',
          tags: tags || [],
          file_url: blob.downloadUrl,
          institution: institution || userData?.institution || '匿名学术难民',
          stars: 0,
          views: 0,
          starred_by: []
        }
      ])
      .select()
      .single();

    if (paperError) {
      return res.status(200).json({
        fileUrl: blob.downloadUrl,
        warning: '文件已上传，但创建论文记录失败'
      });
    }

    return res.status(200).json({ paper });
  } catch (e) {
    console.error('上传错误:', e);
    return res.status(500).json({ error: '上传失败' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/papers', papersRoutes);

// Serve SPA for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
