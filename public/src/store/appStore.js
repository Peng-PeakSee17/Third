import { computed, inject, reactive } from 'vue';
import { getPostScore, getTagSummary, includesKeyword } from '../utils/ui.js';

export const APP_STORE_KEY = 'app-store';

const API = import.meta.env.VITE_API_URL || '/api';

function parseStoredUser(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }
  return data;
}

export function createAppStore(router) {
  const state = reactive({
    token: localStorage.getItem('token') || '',
    currentUser: parseStoredUser(localStorage.getItem('user')),
    activeFeed: 'latest',
    searchQuery: '',
    allPosts: [],
    feedPosts: [],
    loadingAll: false,
    loadingFeed: false,
    showAuthModal: false,
    authMode: 'login',
    authSubmitting: false,
    showPublishModal: false,
    publishSubmitting: false,
    showPostModal: false,
    selectedPost: null,
    detailLoading: false
  });

  const isLoggedIn = computed(() => Boolean(state.token && state.currentUser));

  const dashboardCards = computed(() => {
    const totalPosts = state.allPosts.length;
    const totalViews = state.allPosts.reduce((sum, post) => sum + (post.views || 0), 0);
    const totalFavorites = state.allPosts.reduce((sum, post) => sum + ((post.favorites || []).length), 0);
    const topTag = getTagSummary(state.allPosts)[0];

    return [
      {
        label: '当前馆藏',
        value: totalPosts,
        hint: totalPosts ? '持续增长中' : '等待首篇投递',
        icon: 'library-big'
      },
      {
        label: '总浏览量',
        value: totalViews,
        hint: '围观热度',
        icon: 'eye'
      },
      {
        label: '被收藏次数',
        value: totalFavorites,
        hint: '有价值的垃圾',
        icon: 'bookmark'
      },
      {
        label: '热门标签',
        value: topTag ? topTag.tag : '待生成',
        hint: topTag ? `${topTag.count} 篇内容关联` : '暂无标签数据',
        icon: 'sparkles'
      }
    ];
  });

  const featuredPosts = computed(() =>
    [...state.allPosts]
      .sort((a, b) => getPostScore(b) - getPostScore(a))
      .slice(0, 4)
  );

  const trendingTags = computed(() => getTagSummary(state.allPosts).slice(0, 8));

  const searchResults = computed(() => {
    if (!state.searchQuery.trim()) {
      return featuredPosts.value;
    }
    return state.allPosts.filter((post) => includesKeyword(post, state.searchQuery));
  });

  const archiveBuckets = computed(() => {
    const scored = [...state.allPosts].sort((a, b) => getPostScore(a) - getPostScore(b));
    return [
      {
        title: '低热度回收站',
        description: '暂时无人问津，但很适合二次创作。',
        posts: scored.slice(0, 3)
      },
      {
        title: '高压熬夜专区',
        description: '标题一看就知道作者赶在 ddl 前夜完成。',
        posts: state.allPosts.filter((post) =>
          ['熬夜', '极限操作', '血泪史', '课程设计'].some((tag) => (post.tags || []).includes(tag))
        ).slice(0, 3)
      },
      {
        title: '值得打捞的经典',
        description: '虽然自称垃圾，但传播力和收藏数都很能打。',
        posts: featuredPosts.value.slice(0, 3)
      }
    ];
  });

  async function fetchAllPosts() {
    state.loadingAll = true;
    try {
      const data = await request(`${API}/posts`);
      state.allPosts = data.posts || [];
    } finally {
      state.loadingAll = false;
    }
  }

  async function fetchFeedPosts() {
    state.loadingFeed = true;
    try {
      let url = `${API}/posts?tab=${state.activeFeed}`;
      let options = {};

      if (state.searchQuery.trim() && state.activeFeed !== 'favorite') {
        url += `&search=${encodeURIComponent(state.searchQuery.trim())}`;
      }

      if (state.activeFeed === 'favorite') {
        if (!isLoggedIn.value) {
          state.feedPosts = [];
          return;
        }
        url = `${API}/user/favorites`;
        options = {
          headers: {
            Authorization: `Bearer ${state.token}`
          }
        };
      }

      const data = await request(url, options);
      state.feedPosts = data.posts || [];
    } finally {
      state.loadingFeed = false;
    }
  }

  async function refreshAll() {
    await Promise.all([fetchAllPosts(), fetchFeedPosts()]);
  }

  async function bootstrap() {
    await refreshAll();
  }

  function setFeed(tab) {
    state.activeFeed = tab;
  }

  function setSearchQuery(value) {
    state.searchQuery = value;
  }

  function openAuthModal(mode = 'login') {
    state.authMode = mode;
    state.showAuthModal = true;
  }

  function closeAuthModal() {
    state.showAuthModal = false;
  }

  async function submitAuth(payload) {
    state.authSubmitting = true;
    try {
      const endpoint = state.authMode === 'register' ? '/auth/register' : '/auth/login';
      const data = await request(`${API}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      state.token = data.token;
      state.currentUser = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      closeAuthModal();
      await refreshAll();
    } finally {
      state.authSubmitting = false;
    }
  }

  function logout() {
    state.token = '';
    state.currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    refreshAll();
  }

  function openPublishModal() {
    if (!isLoggedIn.value) {
      openAuthModal('login');
      return;
    }
    state.showPublishModal = true;
  }

  function closePublishModal() {
    state.showPublishModal = false;
  }

  async function publishPost(payload) {
    if (!isLoggedIn.value) {
      openAuthModal('login');
      return;
    }

    state.publishSubmitting = true;
    try {
      await request(`${API}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.token}`
        },
        body: JSON.stringify(payload)
      });
      closePublishModal();
      state.activeFeed = 'latest';
      await refreshAll();
      if (router.currentRoute.value.name !== 'home') {
        router.push({ name: 'home' });
      }
    } finally {
      state.publishSubmitting = false;
    }
  }

  async function openPost(postId) {
    state.detailLoading = true;
    state.showPostModal = true;
    try {
      const options = state.token
        ? {
            headers: {
              Authorization: `Bearer ${state.token}`
            }
          }
        : {};
      const data = await request(`${API}/posts/${postId}`, options);
      state.selectedPost = data.post || null;
    } finally {
      state.detailLoading = false;
    }
  }

  function closePostModal() {
    state.showPostModal = false;
    state.selectedPost = null;
  }

  async function toggleFavorite(postId) {
    if (!isLoggedIn.value) {
      openAuthModal('login');
      return;
    }

    await request(`${API}/posts/${postId}/favorite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${state.token}`
      }
    });

    await refreshAll();
    if (state.selectedPost?.id === postId) {
      await openPost(postId);
    }
  }

  return {
    state,
    isLoggedIn,
    dashboardCards,
    featuredPosts,
    trendingTags,
    searchResults,
    archiveBuckets,
    bootstrap,
    fetchFeedPosts,
    fetchAllPosts,
    refreshAll,
    setFeed,
    setSearchQuery,
    openAuthModal,
    closeAuthModal,
    submitAuth,
    logout,
    openPublishModal,
    closePublishModal,
    publishPost,
    openPost,
    closePostModal,
    toggleFavorite
  };
}

export function useAppStore() {
  return inject(APP_STORE_KEY);
}
