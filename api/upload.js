const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' });
    }
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'academic-waste-secret-2024';
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);

    // Get file from body
    const { fileData, fileName, contentType } = req.body || {};
    if (!fileData) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const buffer = Buffer.from(fileData, 'base64');
    const filename = `${Date.now()}-${fileName || 'upload'}`;
    
    const blob = await put(filename, buffer, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: contentType || 'application/octet-stream'
    });
    
    return res.status(200).json({
      url: blob.url,
      downloadedUrl: blob.downloadUrl
    });
  } catch (e) {
    console.error('上传错误:', e);
    return res.status(500).json({ error: '上传失败' });
  }
};
