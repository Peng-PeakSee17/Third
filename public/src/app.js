// ========================================
// 学术垃圾收容所 - Frontend App
// ========================================

const API = '/api';
let currentTab = 'latest';
let currentUser = null;
let isRegisterMode = false;
let token = localStorage.getItem('token');

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initAuth();
  initTabs();
  initModals();
  initPublish();
  initSearch();
  initLogout();
  loadPosts();
});

// ---- Auth ----
function initAuth() {
  if (token) {
    const stored = localStorage.getItem('user');
    if (stored) {
      currentUser = JSON.parse(stored);
      updateUserUI();
    }
  }

  document.getElementById('loginBtn').addEventListener('click', openAuthModal);
  document.getElementById('sidebarLoginBtn').addEventListener('click', openAuthModal);
  document.getElementById('authModalClose').addEventListener('click', closeAuthModal);
  document.getElementById('authSwitch').addEventListener('click', toggleAuthMode);
  document.getElementById('authForm').addEventListener('submit', handleAuth);

  document.getElementById('authModal').addEventListener('click', (e) => {
    if (e.target.id === 'authModal') closeAuthModal();
  });
}

function openAuthModal() {
  if (currentUser) return;
  document.getElementById('authModal').classList.add('open');
  isRegisterMode = false;
  updateAuthUI();
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
}

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  updateAuthUI();
}

function updateAuthUI() {
  const title = document.getElementById('authModalTitle');
  const switchBtn = document.getElementById('authSwitch');
  const instGroup = document.getElementById('instGroup');
  title.textContent = isRegisterMode ? '注册' : '登录';
  switchBtn.textContent = isRegisterMode ? '已有账号？登录' : '没有账号？注册';
  instGroup.style.display = isRegisterMode ? 'block' : 'none';
}

async function handleAuth(e) {
  e.preventDefault();
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;
  const institution = document.getElementById('authInstitution').value.trim();
  const endpoint = isRegisterMode ? '/auth/register' : '/auth/login';
  const body = isRegisterMode ? { username, password, institution } : { username, password };

  try {
    const res = await fetch(API + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || '操作失败'); return; }

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));
    updateUserUI();
    closeAuthModal();
    loadPosts();
  } catch (err) {
    alert('网络错误，请重试');
  }
}

function updateUserUI() {
  if (!currentUser) return;
  document.getElementById('loginBtn').style.display = 'none';
  document.getElementById('sidebarLoginBtn').style.display = 'none';
  const sidebarUser = document.getElementById('sidebarUser');
  sidebarUser.style.display = 'flex';
  document.getElementById('userName').textContent = currentUser.username;
  document.getElementById('userInst').textContent = currentUser.institution || '学术难民';
  document.getElementById('userAvatar').textContent = currentUser.username[0].toUpperCase();
  lucide.createIcons();
}

function initLogout() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.getElementById('loginBtn').style.display = 'flex';
    document.getElementById('sidebarLoginBtn').style.display = 'flex';
    document.getElementById('sidebarUser').style.display = 'none';
    loadPosts();
  });
}

// ---- Tabs ----
function initTabs() {
  const tabs = document.querySelectorAll('.tab-item');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      loadPosts();
    });
  });
}

// ---- Modals ----
function initModals() {
  document.getElementById('publishModalClose').addEventListener('click', closePublishModal);
  document.getElementById('postModalClose').addEventListener('click', closePostModal);
  document.getElementById('publishModal').addEventListener('click', (e) => {
    if (e.target.id === 'publishModal') closePublishModal();
  });
  document.getElementById('postModal').addEventListener('click', (e) => {
    if (e.target.id === 'postModal') closePostModal();
  });
}

function closePublishModal() {
  document.getElementById('publishModal').classList.remove('open');
  document.getElementById('publishForm').reset();
}

function closePostModal() {
  document.getElementById('postModal').classList.remove('open');
}

// ---- Publish ----
function initPublish() {
  document.getElementById('fabBtn').addEventListener('click', () => {
    if (!currentUser) { openAuthModal(); return; }
    document.getElementById('publishModal').classList.add('open');
  });
  document.getElementById('publishForm').addEventListener('submit', handlePublish);
}

async function handlePublish(e) {
  e.preventDefault();
  if (!token) { closePublishModal(); openAuthModal(); return; }

  const title = document.getElementById('publishTitle').value.trim();
  const content = document.getElementById('publishContent').value.trim();
  const tags = document.getElementById('publishTags').value.split(',').map(t => t.trim()).filter(Boolean);

  try {
    const res = await fetch(`${API}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, content, tags })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || '发布失败'); return; }
    closePublishModal();
    loadPosts();
  } catch (err) {
    alert('网络错误，请重试');
  }
}

// ---- Search ----
function initSearch() {
  const input = document.getElementById('searchInput');
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => loadPosts(input.value), 300);
  });
}

// ---- Load Posts ----
async function loadPosts(search = '') {
  const grid = document.getElementById('contentGrid');
  const empty = document.getElementById('emptyState');
  grid.innerHTML = '<div class="empty-state"><p style="color:var(--text-muted)">加载中...</p></div>';
  empty.style.display = 'none';

  let url = `${API}/posts?tab=${currentTab}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  if (currentTab === 'favorite') {
    if (!token) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      empty.querySelector('p').textContent = '登录后查看收藏';
      return;
    }
    url = `${API}/user/favorites`;
  }

  try {
    const res = await fetch(url, token ? { headers: { 'Authorization': `Bearer ${token}` } } : {});
    const data = await res.json();
    const posts = data.posts || [];

    if (posts.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    grid.innerHTML = posts.map((p, i) => renderCard(p, i)).join('');
    lucide.createIcons();

    // Attach click handlers
    grid.querySelectorAll('.post-card').forEach(card => {
      card.addEventListener('click', () => openPost(card.dataset.id));
    });
    grid.querySelectorAll('.btn-fav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
      });
    });
  } catch (err) {
    grid.innerHTML = '<div class="empty-state"><p>加载失败，请刷新重试</p></div>';
  }
}

function renderCard(post, idx) {
  const emoji = getPostEmoji(post.tags);
  const isFav = currentUser && (post.favorites || []).includes(currentUser.id);
  return `
    <article class="post-card" data-id="${post.id}" style="animation-delay:${idx * 50}ms">
      <div class="post-card-thumb">${emoji}</div>
      <div class="post-card-body">
        <h3 class="post-card-title">${escHtml(post.title)}</h3>
        <div class="post-card-meta">
          <div class="post-card-avatar">${post.author[0].toUpperCase()}</div>
          <span class="post-card-author">${escHtml(post.author)}</span>
          <span class="post-card-inst">${escHtml(post.institution || '学术难民')}</span>
        </div>
        ${post.tags && post.tags.length ? `
          <div class="post-tags">
            ${post.tags.slice(0, 3).map(t => `<span class="post-tag">${escHtml(t)}</span>`).join('')}
          </div>
        ` : ''}
        <div class="post-card-stats">
          <span class="post-stat comment">
            <i data-lucide="message-circle"></i> ${post.comments || 0}
          </span>
          <span class="post-stat star ${isFav ? 'active' : ''}">
            <i data-lucide="star"></i> ${post.favorites ? post.favorites.length : 0}
          </span>
          <button class="btn-fav post-stat ${isFav ? 'active' : ''}" data-id="${post.id}" style="margin-left:auto;background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:4px;color:${isFav ? 'var(--accent)' : 'var(--text-muted)'};font-size:12px;">
            <i data-lucide="${isFav ? 'bookmark-check' : 'bookmark'}"></i>
            ${isFav ? '已收藏' : '收藏'}
          </button>
        </div>
      </div>
    </article>
  `;
}

function getPostEmoji(tags) {
  if (!tags || !tags.length) return '📄';
  const tag = tags[0].toLowerCase();
  if (tag.includes('论文') || tag.includes('report')) return '📚';
  if (tag.includes('笔记') || tag.includes('note')) return '📝';
  if (tag.includes('作业') || tag.includes('homework')) return '✍️';
  if (tag.includes('代码') || tag.includes('code')) return '💻';
  if (tag.includes('实验') || tag.includes('lab')) return '🧪';
  return '🗂️';
}

async function toggleFavorite(postId) {
  if (!currentUser) { openAuthModal(); return; }
  try {
    const res = await fetch(`${API}/posts/favorite/${postId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    loadPosts();
  } catch (err) {}
}

function openPost(id) {
  fetch(`${API}/posts/${id}`, token ? { headers: { 'Authorization': `Bearer ${token}` } } : {})
    .then(r => r.json())
    .then(data => {
      if (!data.post) return;
      const p = data.post;
      const isFav = currentUser && (p.favorites || []).includes(currentUser.id);
      document.getElementById('postDetailContent').innerHTML = `
        <div class="post-detail">
          <div class="post-detail-header">
            <h1 class="post-detail-title">${escHtml(p.title)}</h1>
            <div class="post-detail-meta">
              <div class="post-detail-avatar">${p.author[0].toUpperCase()}</div>
              <div>
                <div class="post-detail-author">${escHtml(p.author)}</div>
                <div class="post-detail-inst">${escHtml(p.institution || '学术难民')}</div>
              </div>
              <span class="post-detail-date">${new Date(p.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
          ${p.tags && p.tags.length ? `
            <div class="post-tags" style="margin-bottom:16px">
              ${p.tags.map(t => `<span class="post-tag">${escHtml(t)}</span>`).join('')}
            </div>
          ` : ''}
          <div class="post-detail-body">${escHtml(p.content)}</div>
          <div class="post-detail-actions">
            <button class="post-action-btn ${isFav ? 'active' : ''}" onclick="toggleFavPost('${p.id}', this)">
              <i data-lucide="${isFav ? 'bookmark-check' : 'bookmark'}"></i>
              ${isFav ? '已收藏' : '收藏'}
            </button>
            <button class="post-action-btn" onclick="navigator.clipboard.writeText(window.location.origin + '/?post=${p.id}')">
              <i data-lucide="share-2"></i> 分享
            </button>
          </div>
        </div>
      `;
      lucide.createIcons();
      document.getElementById('postModal').classList.add('open');
    });
}

window.toggleFavPost = async function(postId, btn) {
  if (!currentUser) { closePostModal(); openAuthModal(); return; }
  await fetch(`${API}/posts/favorite/${postId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  closePostModal();
  loadPosts();
};

// ---- Utils ----
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---- Sidebar nav ----
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    const page = item.dataset.page;
    if (page === 'search') {
      document.getElementById('searchInput').focus();
    }
  });
});
