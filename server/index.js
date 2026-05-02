require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const userRoutes = require('./routes/user');
const papersRoutes = require('./routes/papers');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Supabase clients
const supabaseUrl = process.env.SUPABASE_URL || 'https://wkgpyneafghqykiciyxg.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZ3B5bmVhZmdocXlraWNpeXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjczNzEsImV4cCI6MjA5MTUwMzM3MX0.zTPkPVOzK-MtgaMAkdKS6gnKiI9OLJEMe0j1oUqRssw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';

// 确保 papers 存储桶存在
(async () => {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'papers')) {
      await supabaseAdmin.storage.createBucket('papers', { public: false });
      console.log('Created papers storage bucket');
    }
  } catch (e) {
    console.error('Storage bucket check failed:', e.message);
  }
})();

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
    const safeName = `${Date.now()}-${(fileName || 'paper').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')}`;
    const storagePath = `${userId}/${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('papers')
      .upload(storagePath, buffer, {
        contentType: contentType || 'application/octet-stream',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: '文件上传失败' });
    }

    const fileUrl = `/api/files/${storagePath}`;

    const { data: userData } = await supabase
      .from('users')
      .select('username, institution')
      .eq('id', userId)
      .single();

    const { data: paper, error: paperError } = await supabaseAdmin
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
      console.error('[UPLOAD] Paper INSERT failed:', paperError);
      return res.status(500).json({ error: '论文记录创建失败' });
    }

    console.log(`[UPLOAD] Paper created: ${paper.id} by user ${userId}`);
    return res.status(200).json({ paper });
  } catch (e) {
    console.error('上传错误:', e);
    return res.status(500).json({ error: '上传失败' });
  }
});

// 获取文件签名 URL（前端直接从 Supabase Storage 下载，不经过 Express 代理）
app.get('/api/file-url/*', async (req, res) => {
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

  const storagePath = req.params[0];
  if (!storagePath) {
    return res.status(400).json({ error: '文件路径无效' });
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from('papers')
      .createSignedUrl(storagePath, 3600);

    if (error || !data) {
      return res.status(404).json({ error: '文件不存在' });
    }

    res.json({ signedUrl: data.signedUrl });
  } catch (e) {
    console.error('Signed URL error:', e);
    res.status(500).json({ error: '获取文件链接失败' });
  }
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
