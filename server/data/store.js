// Redis store for server-side rendering / Express
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://free-hyena-96606.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAXleAAIncDJkYzlhYjRlYjY2OTU0MzM0Yjk1NTMxMGQ5ZjczYzI4Y3AyOTY2MDY',
});

const POSTS_KEY = 'third:posts';

async function getPosts() {
  try {
    const data = await redis.get(POSTS_KEY);
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') return JSON.parse(data);
    return [];
  } catch (e) {
    console.error('获取帖子失败:', e);
    return [];
  }
}

async function getPostById(id) {
  const posts = await getPosts();
  return posts.find(p => p.id === id) || null;
}

async function addPost(post) {
  const posts = await getPosts();
  posts.unshift(post);
  await redis.set(POSTS_KEY, JSON.stringify(posts));
  return post;
}

async function toggleFavorite(postId, userId) {
  const posts = await getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return null;
  if (!post.favorites) post.favorites = [];
  const idx = post.favorites.indexOf(userId);
  if (idx === -1) {
    post.favorites.push(userId);
  } else {
    post.favorites.splice(idx, 1);
  }
  await redis.set(POSTS_KEY, JSON.stringify(posts));
  return post;
}

module.exports = {
  getPosts, getPostById, addPost, toggleFavorite
};
