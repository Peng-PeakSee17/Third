const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 确保上传目录存在
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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
    const filePath = path.join(UPLOAD_DIR, safeFileName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/api/files/${safeFileName}`;

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
          file_url: fileUrl,
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
        fileUrl,
        warning: '文件已上传，但创建论文记录失败'
      });
    }

    return res.status(200).json({ paper });
  } catch (e) {
    console.error('上传错误:', e);
    return res.status(500).json({ error: '上传失败' });
  }
});

// 文件下载（需 JWT 认证）
app.get('/api/files/:filename', (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: '请先登录' });
    }
    const jwt = require('jsonwebtoken');
    jwt.verify(auth.split(' ')[1], JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token 无效' });
  }

  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }
  res.sendFile(filePath);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/papers', papersRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器 running on port ${PORT}`);
});
