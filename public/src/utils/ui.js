import { nextTick } from 'vue';

export function refreshIcons() {
  nextTick(() => {
    requestAnimationFrame(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    });
  });
}

export function getInitial(value) {
  return (value || '?').trim().charAt(0).toUpperCase() || '?';
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  });
}

export function formatLongDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatNumber(value = 0) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}w`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
}

export function getPostEmoji(tags = []) {
  const tag = (tags[0] || '').toLowerCase();
  if (tag.includes('论文') || tag.includes('report')) return '📚';
  if (tag.includes('笔记') || tag.includes('note')) return '📝';
  if (tag.includes('作业') || tag.includes('homework')) return '✍️';
  if (tag.includes('代码') || tag.includes('code')) return '💻';
  if (tag.includes('实验') || tag.includes('lab')) return '🧪';
  return '🗂️';
}

export function getPostScore(post) {
  return (post.stars || 0) * 2 + (post.comments || 0) * 3 + Math.round((post.views || 0) / 80);
}

export function getTagSummary(posts = []) {
  const counter = new Map();
  posts.forEach((post) => {
    (post.tags || []).forEach((tag) => {
      counter.set(tag, (counter.get(tag) || 0) + 1);
    });
  });
  return [...counter.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function includesKeyword(post, keyword) {
  const query = keyword.trim().toLowerCase();
  if (!query) return true;
  const target = [
    post.title,
    post.content,
    post.author,
    post.institution,
    ...(post.tags || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return target.includes(query);
}
