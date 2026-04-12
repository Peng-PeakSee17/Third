const { put } = require('@vercel/blob');
const supabase = require('./auth/supabase');

// POST /api/upload - 上传论文文件（需认证）
// 返回文件 URL 和下载签名链接
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const { fileData, fileName, contentType, title, description, tags, institution } = req.body || {};

    if (!fileData) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    if (!title) {
      return res.status(400).json({ error: '标题必填' });
    }

    // 解析文件
    const buffer = Buffer.from(fileData, 'base64');
    const safeFileName = `${Date.now()}-${(fileName || 'paper').replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // 上传到 Vercel Blob（私密模式）
    const blob = await put(safeFileName, buffer, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: contentType || 'application/octet-stream'
    });

    // 获取用户信息
    const { data: userData } = await supabase
      .from('users')
      .select('username, institution')
      .eq('id', userId)
      .single();

    // 写入 papers 表
    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .insert([
        {
          user_id: userId,
          title,
          description: description || '',
          tags: tags || [],
          file_url: blob.downloadUrl, // 使用下载链接
          institution: institution || userData?.institution || '匿名学术难民',
          stars: 0,
          views: 0
        }
      ])
      .select()
      .single();

    if (paperError) {
      console.error('创建论文记录失败:', paperError);
      // 文件已上传，但数据库记录失败，返回文件信息让前端可以重试
      return res.status(200).json({
        fileUrl: blob.downloadUrl,
        fileName: safeFileName,
        warning: '文件已上传，但创建论文记录失败'
      });
    }

    return res.status(200).json({
      paper
    });
  } catch (e) {
    console.error('上传错误:', e);
    return res.status(500).json({ error: '上传失败' });
  }
};
