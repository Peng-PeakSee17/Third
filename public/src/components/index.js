import {
  computed,
  reactive,
  watch
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '../store/appStore.js';
import {
  formatDate,
  formatLongDate,
  formatNumber,
  getInitial,
  getPostEmoji,
  refreshIcons
} from '../utils/ui.js';

export const AppIcon = {
  props: {
    name: {
      type: String,
      required: true
    }
  },
  mounted() {
    refreshIcons();
  },
  updated() {
    refreshIcons();
  },
  template: `<i :data-lucide="name"></i>`
};

export const AppHeader = {
  components: { AppIcon },
  setup() {
    const store = useAppStore();
    const router = useRouter();
    const route = useRoute();
    const searchModel = computed({
      get: () => store.state.searchQuery,
      set: (value) => store.setSearchQuery(value)
    });

    const navItems = [
      { label: 'HOME', sub: '主页', name: 'home' },
      { label: 'NEWS', sub: '新闻', name: 'news' },
      { label: 'FORUM', sub: '暧昧区', name: 'forum' },
      { label: 'SUBMIT', sub: '插足', name: 'submit' },
      { label: 'TRENDING', sub: '修罗场', name: 'trending' },
      { label: 'USER', sub: '局中人', name: 'user' }
    ];

    function go(name) {
      router.push({ name });
    }

    function goSearch() {
      if (router.currentRoute.value.name !== 'search') {
        router.push({ name: 'search' });
      }
    }

    return { store, route, navItems, go, searchModel, goSearch };
  },
  template: `
    <header class="app-header">
      <div class="header-row-1">
        <button class="menu-button">
          <AppIcon name="menu" />
        </button>
        <div class="logo-block">
          <img src="/images/Third_Logo.png" alt="Third" class="header-logo">
          <span class="logo-text">Third</span>
        </div>
        <div class="header-search">
          <AppIcon name="search" />
          <input
            v-model="searchModel"
            type="text"
            placeholder="搜索..."
            @focus="goSearch"
          >
        </div>
        <button v-if="!store.isLoggedIn" class="login-button" @click="store.openAuthModal('login')">
          <AppIcon name="log-in" />
          <span>登录</span>
        </button>
        <button v-else class="profile-button">
          <span class="avatar-circle">{{ getInitial(store.state.currentUser?.username) }}</span>
        </button>
      </div>

      <nav class="header-row-2">
        <button
          v-for="item in navItems"
          :key="item.name"
          class="nav-item"
          :class="{ active: route.name === item.name }"
          @click="go(item.name)"
        >
          <span class="nav-label">{{ item.label }}</span>
          <span class="nav-sub">{{ item.sub }}</span>
        </button>
      </nav>
    </header>
  `
};

export const AppSidebar = {
  components: { AppIcon },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useAppStore();
    const navItems = [
      { label: '首页', icon: 'layout-dashboard', name: 'home' },
      { label: '发现', icon: 'compass', name: 'discover' },
      { label: '回收站', icon: 'archive', name: 'recycle' },
      { label: '搜索', icon: 'search', name: 'search' }
    ];

    function go(name) {
      router.push({ name });
    }

    return { route, store, navItems, go, getInitial };
  },
  template: `
    <aside class="app-sidebar">
      <div class="sidebar-panel">
        <div class="sidebar-intro">
          <span class="eyebrow">Component Layout</span>
          <h2>完整页面拆分</h2>
          <p>首页、发现、回收站、搜索四个页面统一在一套 Vue3 组件系统下管理。</p>
        </div>

        <nav class="sidebar-nav">
          <button
            v-for="item in navItems"
            :key="item.name"
            class="nav-link"
            :class="{ active: route.name === item.name }"
            @click="go(item.name)"
          >
            <AppIcon :name="item.icon" />
            <span>{{ item.label }}</span>
          </button>
        </nav>

        <div class="sidebar-card">
          <div class="sidebar-card-head">
            <span class="eyebrow">系统状态</span>
            <strong>{{ store.state.allPosts.length }} 篇</strong>
          </div>
          <p>当前以暗色学术风格重构，后续可以继续细化交互、动效和数据可视化。</p>
          <button class="primary-button wide-button" @click="store.openPublishModal()">
            <AppIcon name="feather" />
            <span>快速发布</span>
          </button>
        </div>
      </div>

      <div v-if="store.isLoggedIn" class="sidebar-user-card">
        <span class="avatar-circle large">{{ getInitial(store.state.currentUser?.username) }}</span>
        <div class="user-meta">
          <strong>{{ store.state.currentUser?.username }}</strong>
          <span>{{ store.state.currentUser?.institution || '学术难民' }}</span>
        </div>
        <button class="icon-button" @click="store.logout()">
          <AppIcon name="log-out" />
        </button>
      </div>

      <div class="mobile-nav">
        <button
          v-for="item in navItems"
          :key="item.name + '-mobile'"
          class="mobile-nav-link"
          :class="{ active: route.name === item.name }"
          @click="go(item.name)"
        >
          <AppIcon :name="item.icon" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </aside>
  `
};

export const Banner = {
  props: {
    title: String,
    subtitle: String,
    variant: {
      type: String,
      default: 'default'
    }
  },
  template: `
    <section class="page-banner" :class="variant">
      <div class="banner-content">
        <h1 v-if="title">{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
        <slot></slot>
      </div>
    </section>
  `
};

export const HeroBanner = {
  components: { AppIcon },
  props: {
    badge: String,
    title: String,
    description: String,
    primaryLabel: String,
    secondaryLabel: String
  },
  emits: ['primary', 'secondary'],
  template: `
    <section class="hero-banner">
      <div class="hero-copy">
        <span class="eyebrow">{{ badge }}</span>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
        <div class="hero-actions">
          <button class="primary-button" @click="$emit('primary')">
            <AppIcon name="sparkles" />
            <span>{{ primaryLabel }}</span>
          </button>
          <button class="ghost-button" @click="$emit('secondary')">
            <AppIcon name="arrow-right" />
            <span>{{ secondaryLabel }}</span>
          </button>
        </div>
      </div>

      <div class="hero-metric-board">
        <div class="metric-chip">
          <span>Dark Theme</span>
          <strong>Vue 3</strong>
        </div>
        <div class="metric-chip">
          <span>Page Split</span>
          <strong>4 Views</strong>
        </div>
        <div class="metric-chip">
          <span>Interaction</span>
          <strong>Modal + Feed</strong>
        </div>
      </div>
    </section>
  `
};

export const StatsStrip = {
  components: { AppIcon },
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    formatNumber
  },
  template: `
    <section class="stats-strip">
      <article v-for="item in items" :key="item.label" class="stats-card">
        <div class="stats-card-head">
          <span>{{ item.label }}</span>
          <AppIcon :name="item.icon" />
        </div>
        <strong>{{ typeof item.value === 'number' ? formatNumber(item.value) : item.value }}</strong>
        <p>{{ item.hint }}</p>
      </article>
    </section>
  `
};

export const FeedTabs = {
  setup() {
    const store = useAppStore();
    const tabs = [
      { label: '最新', value: 'latest', description: '按发布时间浏览' },
      { label: '热门', value: 'hot', description: '按互动热度排序' },
      { label: '收藏', value: 'favorite', description: '查看个人收藏夹' }
    ];
    return { store, tabs };
  },
  template: `
    <div class="feed-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="feed-tab"
        :class="{ active: store.state.activeFeed === tab.value }"
        @click="store.setFeed(tab.value)"
      >
        <strong>{{ tab.label }}</strong>
        <span>{{ tab.description }}</span>
      </button>
    </div>
  `
};

export const PostCard = {
  components: { AppIcon },
  props: {
    post: {
      type: Object,
      required: true
    },
    compact: Boolean
  },
  setup(props) {
    const store = useAppStore();
    const isFavorite = computed(() =>
      Boolean(store.state.currentUser && (props.post.favorites || []).includes(store.state.currentUser.id))
    );
    return { store, isFavorite, getInitial, getPostEmoji, formatDate, formatNumber };
  },
  template: `
    <article class="post-card" :class="{ compact }" @click="store.openPost(post.id)">
      <div class="post-cover">
        <span>{{ getPostEmoji(post.tags) }}</span>
      </div>

      <div class="post-content">
        <div class="post-topline">
          <span class="post-date">{{ formatDate(post.createdAt) }}</span>
          <button class="bookmark-chip" :class="{ active: isFavorite }" @click.stop="store.toggleFavorite(post.id)">
            <AppIcon :name="isFavorite ? 'bookmark-check' : 'bookmark'" />
          </button>
        </div>

        <h3>{{ post.title }}</h3>
        <p class="post-summary">{{ post.content }}</p>

        <div class="post-tags">
          <span v-for="tag in (post.tags || []).slice(0, 3)" :key="tag" class="post-tag">#{{ tag }}</span>
        </div>

        <div class="post-author-row">
          <span class="mini-avatar">{{ getInitial(post.author) }}</span>
          <div>
            <strong>{{ post.author }}</strong>
            <span>{{ post.institution || '学术难民' }}</span>
          </div>
        </div>

        <div class="post-stats">
          <span><AppIcon name="message-circle" /> {{ formatNumber(post.comments || 0) }}</span>
          <span><AppIcon name="star" /> {{ formatNumber(post.stars || 0) }}</span>
          <span><AppIcon name="eye" /> {{ formatNumber(post.views || 0) }}</span>
        </div>
      </div>
    </article>
  `
};

export const PostGrid = {
  components: { PostCard },
  props: {
    posts: {
      type: Array,
      default: () => []
    },
    loading: Boolean,
    emptyTitle: {
      type: String,
      default: '暂无内容'
    },
    emptyDescription: {
      type: String,
      default: '稍后再来看看。'
    },
    compact: Boolean
  },
  template: `
    <div v-if="loading" class="grid-state">
      <div class="loading-card" v-for="item in 3" :key="item"></div>
    </div>
    <div v-else-if="posts.length" class="post-grid">
      <PostCard v-for="post in posts" :key="post.id" :post="post" :compact="compact" />
    </div>
    <div v-else class="empty-card">
      <strong>{{ emptyTitle }}</strong>
      <p>{{ emptyDescription }}</p>
    </div>
  `
};

export const InsightPanel = {
  components: { AppIcon, PostCard },
  props: {
    title: String,
    description: String,
    tags: {
      type: Array,
      default: () => []
    },
    posts: {
      type: Array,
      default: () => []
    }
  },
  template: `
    <aside class="insight-panel">
      <div class="panel-block">
        <span class="eyebrow">{{ title }}</span>
        <p>{{ description }}</p>
        <div class="tag-cloud">
          <button v-for="tag in tags" :key="tag.tag" class="tag-cloud-item">
            <span>#{{ tag.tag }}</span>
            <strong>{{ tag.count }}</strong>
          </button>
        </div>
      </div>

      <div class="panel-block">
        <div class="panel-title">
          <AppIcon name="flame" />
          <strong>热度精选</strong>
        </div>
        <div class="mini-list">
          <PostCard v-for="post in posts" :key="post.id" :post="post" compact />
        </div>
      </div>
    </aside>
  `
};

export const AuthModal = {
  components: { AppIcon },
  setup() {
    const store = useAppStore();
    const form = reactive({
      username: '',
      password: '',
      institution: ''
    });
    const error = reactive({ message: '' });

    watch(
      () => store.state.showAuthModal,
      (open) => {
        if (open) {
          error.message = '';
        }
      }
    );

    async function submit() {
      error.message = '';
      try {
        await store.submitAuth({
          username: form.username.trim(),
          password: form.password,
          institution: form.institution.trim()
        });
        form.username = '';
        form.password = '';
        form.institution = '';
      } catch (err) {
        error.message = err.message;
      }
    }

    function closeOnMask(event) {
      if (event.target === event.currentTarget) {
        store.closeAuthModal();
      }
    }

    return { store, form, error, submit, closeOnMask };
  },
  template: `
    <div v-if="store.state.showAuthModal" class="modal-mask" @click="closeOnMask">
      <div class="modal-panel auth-panel">
        <button class="icon-button floating-close" @click="store.closeAuthModal()">
          <AppIcon name="x" />
        </button>
        <span class="eyebrow">{{ store.state.authMode === 'register' ? 'Create Account' : 'Welcome Back' }}</span>
        <h3>{{ store.state.authMode === 'register' ? '注册账号' : '登录继续浏览' }}</h3>
        <p>保留收藏、发布内容和查看完整详情都依赖账号状态。</p>

        <label class="form-field">
          <span>用户名</span>
          <input v-model="form.username" type="text" placeholder="输入你的学术昵称">
        </label>

        <label class="form-field">
          <span>密码</span>
          <input v-model="form.password" type="password" placeholder="设置一个不会忘的密码">
        </label>

        <label v-if="store.state.authMode === 'register'" class="form-field">
          <span>所属机构</span>
          <input v-model="form.institution" type="text" placeholder="例如：某不知名学院">
        </label>

        <span v-if="error.message" class="form-error">{{ error.message }}</span>

        <div class="modal-actions">
          <button class="ghost-button" @click="store.state.authMode = store.state.authMode === 'login' ? 'register' : 'login'">
            <AppIcon name="refresh-cw" />
            <span>{{ store.state.authMode === 'login' ? '切换注册' : '切换登录' }}</span>
          </button>
          <button class="primary-button" :disabled="store.state.authSubmitting" @click="submit">
            <AppIcon name="shield-check" />
            <span>{{ store.state.authSubmitting ? '提交中...' : '确认' }}</span>
          </button>
        </div>
      </div>
    </div>
  `
};

export const PublishModal = {
  components: { AppIcon },
  setup() {
    const store = useAppStore();
    const form = reactive({
      title: '',
      content: '',
      tags: ''
    });
    const error = reactive({ message: '' });

    async function submit() {
      error.message = '';
      try {
        await store.publishPost({
          title: form.title.trim(),
          content: form.content.trim(),
          tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        });
        form.title = '';
        form.content = '';
        form.tags = '';
      } catch (err) {
        error.message = err.message;
      }
    }

    function closeOnMask(event) {
      if (event.target === event.currentTarget) {
        store.closePublishModal();
      }
    }

    return { store, form, error, submit, closeOnMask };
  },
  template: `
    <div v-if="store.state.showPublishModal" class="modal-mask" @click="closeOnMask">
      <div class="modal-panel publish-panel">
        <button class="icon-button floating-close" @click="store.closePublishModal()">
          <AppIcon name="x" />
        </button>
        <span class="eyebrow">Publish Draft</span>
        <h3>投放新的学术垃圾</h3>
        <p>继续保留原有发布能力，并把表单融入新的视觉体系。</p>

        <label class="form-field">
          <span>标题</span>
          <input v-model="form.title" type="text" placeholder="给这份垃圾起个醒目的标题">
        </label>

        <label class="form-field">
          <span>内容</span>
          <textarea v-model="form.content" rows="7" placeholder="补充内容、摘要或者吐槽"></textarea>
        </label>

        <label class="form-field">
          <span>标签</span>
          <input v-model="form.tags" type="text" placeholder="论文, 作业, 速成, 熬夜">
        </label>

        <span v-if="error.message" class="form-error">{{ error.message }}</span>

        <div class="modal-actions">
          <button class="ghost-button" @click="store.closePublishModal()">
            <AppIcon name="corner-down-left" />
            <span>取消</span>
          </button>
          <button class="primary-button" :disabled="store.state.publishSubmitting" @click="submit">
            <AppIcon name="send" />
            <span>{{ store.state.publishSubmitting ? '发布中...' : '立即发布' }}</span>
          </button>
        </div>
      </div>
    </div>
  `
};

export const PostDetailModal = {
  components: { AppIcon },
  setup() {
    const store = useAppStore();
    const isFavorite = computed(() =>
      Boolean(
        store.state.selectedPost &&
        store.state.currentUser &&
        (store.state.selectedPost.favorites || []).includes(store.state.currentUser.id)
      )
    );

    function closeOnMask(event) {
      if (event.target === event.currentTarget) {
        store.closePostModal();
      }
    }

    async function copyLink() {
      if (!store.state.selectedPost) return;
      await navigator.clipboard.writeText(`${window.location.origin}/?post=${store.state.selectedPost.id}`);
    }

    return { store, isFavorite, closeOnMask, copyLink, getInitial, formatLongDate, formatNumber };
  },
  template: `
    <div v-if="store.state.showPostModal" class="modal-mask" @click="closeOnMask">
      <div class="modal-panel detail-panel">
        <button class="icon-button floating-close" @click="store.closePostModal()">
          <AppIcon name="x" />
        </button>

        <div v-if="store.state.detailLoading" class="detail-loading">加载详情中...</div>

        <template v-else-if="store.state.selectedPost">
          <span class="eyebrow">Post Detail</span>
          <h3 class="detail-title">{{ store.state.selectedPost.title }}</h3>

          <div class="detail-meta">
            <span class="avatar-circle large">{{ getInitial(store.state.selectedPost.author) }}</span>
            <div>
              <strong>{{ store.state.selectedPost.author }}</strong>
              <span>{{ store.state.selectedPost.institution || '学术难民' }}</span>
            </div>
            <time>{{ formatLongDate(store.state.selectedPost.createdAt) }}</time>
          </div>

          <div class="post-tags">
            <span v-for="tag in store.state.selectedPost.tags || []" :key="tag" class="post-tag">#{{ tag }}</span>
          </div>

          <div class="detail-body">{{ store.state.selectedPost.content }}</div>

          <div class="detail-stats">
            <span><AppIcon name="message-circle" /> {{ formatNumber(store.state.selectedPost.comments || 0) }}</span>
            <span><AppIcon name="star" /> {{ formatNumber(store.state.selectedPost.stars || 0) }}</span>
            <span><AppIcon name="eye" /> {{ formatNumber(store.state.selectedPost.views || 0) }}</span>
          </div>

          <div class="modal-actions">
            <button class="ghost-button" @click="store.toggleFavorite(store.state.selectedPost.id)">
              <AppIcon :name="isFavorite ? 'bookmark-check' : 'bookmark'" />
              <span>{{ isFavorite ? '已收藏' : '加入收藏' }}</span>
            </button>
            <button class="primary-button" @click="copyLink">
              <AppIcon name="share-2" />
              <span>复制链接</span>
            </button>
          </div>
        </template>
      </div>
    </div>
  `
};
