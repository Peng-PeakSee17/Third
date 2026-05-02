import {
  computed,
  ref,
  reactive,
  watch,
  onMounted,
  onUnmounted
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
    const showSearchPopup = ref(false);
    const showMenu = ref(false);

    const navItems = [
      { label: 'HOME', sub: '主页', name: 'home' },
      { label: 'NEWS', sub: '新闻', name: 'news' },
      { label: 'FORUM', sub: '暧昧区', name: 'forum' },
      { label: 'SUBMIT', sub: '插足', name: 'submit' },
      { label: 'TRENDING', sub: '修罗场', name: 'trending' },
      { label: 'USER', sub: '局中人', name: 'user' }
    ];

    function go(name) {
      if ((name === 'user' || name === 'submit') && !store.isLoggedIn) {
        store.openAuthModal('login');
        return;
      }
      router.push({ name });
    }

    function toggleMenu() {
      showMenu.value = !showMenu.value;
    }

    function closeMenu() {
      showMenu.value = false;
    }

    function toggleSearchPopup() {
      showSearchPopup.value = !showSearchPopup.value;
    }

    function onSearchFocus() {
      showSearchPopup.value = true;
    }

    function onSearchBlur() {
      setTimeout(() => {
        showSearchPopup.value = false;
      }, 200);
    }

    function onSearchSubmit() {
      if (router.currentRoute.value.name !== 'search') {
        router.push({ name: 'search' });
      }
      showSearchPopup.value = false;
    }

    return { store, route, navItems, go, searchModel, goSearch: toggleSearchPopup, getInitial, showSearchPopup, onSearchFocus, onSearchBlur, onSearchSubmit, showMenu, toggleMenu, closeMenu };
  },
  template: `
    <header class="app-header">
      <div class="header-row-1">
        <div class="header-left">
          <button class="menu-button" @click="toggleMenu">
            <AppIcon name="menu" />
            <span class="menu-text">Menu</span>
          </button>
        </div>
        <div class="header-center">
          <div class="logo-block">
            <div class="logo-main">
              <div class="logo-row">
                <span class="logo-letter">T</span>
                <span class="logo-dot"></span>
                <span class="logo-letter">H</span>
                <span class="logo-dot"></span>
                <span class="logo-letter">I</span>
                <span class="logo-dot"></span>
                <span class="logo-letter">R</span>
                <span class="logo-dot"></span>
                <span class="logo-letter">D</span>
              </div>
            </div>
            <div class="logo-sub">
              <span>Talent</span>
              <span>Humanities</span>
              <span>Intelligence</span>
              <span>Responsibility</span>
              <span>Dream</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <button class="header-search-btn" @click="goSearch">
            <AppIcon name="search" />
          </button>
          <button v-if="!store.isLoggedIn" class="header-login-btn" @click="store.openAuthModal('login')">登录</button>
          <button v-else class="header-user-btn" @click="go('user')">
            <span class="avatar-circle small">{{ getInitial(store.state.currentUser?.username) }}</span>
            <span>{{ store.state.currentUser?.username }}</span>
          </button>
        </div>
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

      <div v-if="showSearchPopup" class="search-popup">
        <input
          class="search-popup-input"
          v-model="searchModel"
          type="text"
          placeholder="搜索..."
          @focus="onSearchFocus"
          @blur="onSearchBlur"
          @keyup.enter="onSearchSubmit"
        >
      </div>

      <div v-if="showMenu" class="menu-overlay" @click="closeMenu"></div>
      <Teleport to="body">
        <div v-if="showMenu" class="menu-sidebar">
          <div class="menu-sidebar-header">
            <button class="menu-login-btn" v-if="!store.isLoggedIn" @click="store.openAuthModal('login'); closeMenu()">
              <AppIcon name="log-in" />
              <span>登录 / 注册</span>
            </button>
            <button class="menu-login-btn logged-in" v-else @click="go('user'); closeMenu()">
              <span class="avatar-circle">{{ getInitial(store.state.currentUser?.username) }}</span>
              <span>{{ store.state.currentUser?.username }}</span>
            </button>
          </div>
          <nav class="menu-sidebar-nav">
            <button
              v-for="item in navItems"
              :key="item.name"
              class="menu-nav-item"
              :class="{ active: route.name === item.name }"
              @click="go(item.name); closeMenu()"
            >
              <span class="menu-nav-label">{{ item.label }}</span>
              <span class="menu-nav-sub">{{ item.sub }}</span>
            </button>
          </nav>
        </div>
      </Teleport>
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
      email: '',
      password: '',
      confirmPassword: '',
      institution: ''
    });
    const error = reactive({ message: '' });
    const registerStep = ref('form');
    const verificationCode = ref('');
    const resendCountdown = ref(0);
    const registerSuccess = ref(false);
    const universityList = ref([]);
    const universitySuggestions = ref([]);
    const showPassword = ref(false);
    const showConfirmPassword = ref(false);
    const usernameHasChinese = computed(() => /[\u4e00-\u9fff]/.test(form.username));
    let countdownTimer = null;

    // Reset password state
    const resetStep = ref('email');
    const resetEmail = ref('');
    const resetCode = ref('');
    const resetNewPassword = ref('');
    const resetConfirmPassword = ref('');
    const resetCountdown = ref(0);
    const showResetPassword = ref(false);
    const showResetConfirmPassword = ref(false);
    const resetSuccess = ref(false);
    let resetCountdownTimer = null;

    function startCountdown() {
      resendCountdown.value = 60;
      clearInterval(countdownTimer);
      countdownTimer = setInterval(() => {
        resendCountdown.value--;
        if (resendCountdown.value <= 0) {
          clearInterval(countdownTimer);
          countdownTimer = null;
        }
      }, 1000);
    }

    onUnmounted(() => {
      clearInterval(countdownTimer);
      clearInterval(resetCountdownTimer);
    });

    let cachedUniversityList = null;

    onMounted(async () => {
      if (!cachedUniversityList) {
        try {
          const response = await fetch('https://cdn.jsdelivr.net/gh/codeudan/crawler-china-mainland-universities/china_mainland_universities.json');
          const data = await response.json();
          cachedUniversityList = [];
          if (Array.isArray(data)) {
            cachedUniversityList = data.map((item) => ({ name: item.name, province: item.province || '' }));
          } else {
            for (const [province, unis] of Object.entries(data)) {
              let list = unis;
              if (!Array.isArray(list) && list.all) {
                list = list.all;
              }
              if (Array.isArray(list)) {
                for (const uni of list) {
                  const name = typeof uni === 'string' ? uni : uni.name;
                  cachedUniversityList.push({ name, province });
                }
              }
            }
          }
        } catch {
          cachedUniversityList = [];
        }
      }
      universityList.value = cachedUniversityList;
    });

    function filterUniversities() {
      const keyword = form.institution.trim();
      if (!keyword) {
        universitySuggestions.value = [];
        return;
      }
      const lower = keyword.toLowerCase();
      universitySuggestions.value = universityList.value
        .filter((u) => u.name.toLowerCase().includes(lower))
        .slice(0, 8);
    }

    function selectUniversity(name) {
      form.institution = name;
      universitySuggestions.value = [];
    }

    function onInstitutionBlur() {
      setTimeout(() => {
        universitySuggestions.value = [];
      }, 200);
    }

    watch(
      () => store.state.showAuthModal,
      (open) => {
        if (open) {
          error.message = '';
          registerStep.value = 'form';
          registerSuccess.value = false;
          verificationCode.value = '';
          resendCountdown.value = 0;
          clearInterval(countdownTimer);
        }
      }
    );

    async function submit() {
      error.message = '';

      if (store.state.authMode === 'login') {
        if (!form.email.trim()) {
          error.message = '邮箱不能为空';
          return;
        }
      }
      if (store.state.authMode === 'register') {
        if (!form.username.trim()) {
          error.message = '用户名不能为空';
          return;
        }
      }
      if (store.state.authMode === 'register' && /[^\x00-\x7F]/.test(form.username)) {
        error.message = '用户名仅支持英文、数字和符号';
        return;
      }
      if (!form.password) {
        error.message = '密码不能为空';
        return;
      }

      if (store.state.authMode === 'register') {
        if (!form.email.trim()) {
          error.message = '邮箱不能为空';
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
          error.message = '邮箱格式不正确';
          return;
        }
        if (form.password !== form.confirmPassword) {
          error.message = '两次密码不一致';
          return;
        }
      }

      try {
        if (store.state.authMode === 'register') {
          await store.sendVerificationCode({
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
            institution: form.institution.trim()
          });
          registerStep.value = 'code';
          startCountdown();
        } else {
          await store.submitAuth({
            email: form.email.trim(),
            password: form.password
          });
          form.username = '';
          form.email = '';
          form.password = '';
          form.confirmPassword = '';
          form.institution = '';
        }
      } catch (err) {
        error.message = err.message;
      }
    }

    async function verifyCode() {
      error.message = '';
      if (!verificationCode.value.trim()) {
        error.message = '请输入验证码';
        return;
      }
      try {
        await store.verifyAndRegister({
          email: form.email.trim(),
          code: verificationCode.value.trim()
        });
        registerSuccess.value = true;
        verificationCode.value = '';
        setTimeout(() => {
          store.closeAuthModal();
          form.username = '';
          form.email = '';
          form.password = '';
          form.confirmPassword = '';
          form.institution = '';
        }, 2000);
      } catch (err) {
        error.message = err.message;
      }
    }

    async function resendCode() {
      if (resendCountdown.value > 0) return;
      error.message = '';
      try {
        await store.sendVerificationCode({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          institution: form.institution.trim()
        });
        startCountdown();
      } catch (err) {
        error.message = err.message;
      }
    }

    // --- Reset password methods ---
    function goToReset() {
      store.state.authMode = 'reset';
      resetStep.value = 'email';
      resetEmail.value = '';
      resetCode.value = '';
      resetNewPassword.value = '';
      resetSuccess.value = false;
      error.message = '';
      resetCountdown.value = 0;
      clearInterval(resetCountdownTimer);
    }

    function startResetCountdown() {
      resetCountdown.value = 60;
      clearInterval(resetCountdownTimer);
      resetCountdownTimer = setInterval(() => {
        resetCountdown.value--;
        if (resetCountdown.value <= 0) {
          clearInterval(resetCountdownTimer);
          resetCountdownTimer = null;
        }
      }, 1000);
    }

    async function submitResetEmail() {
      error.message = '';
      if (!resetEmail.value.trim()) {
        error.message = '邮箱不能为空';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.value.trim())) {
        error.message = '邮箱格式不正确';
        return;
      }
      try {
        await store.sendResetCode({ email: resetEmail.value.trim() });
        resetStep.value = 'code';
        startResetCountdown();
      } catch (err) {
        error.message = err.message;
      }
    }

    async function submitResetPassword() {
      error.message = '';
      if (!resetCode.value.trim()) {
        error.message = '请输入验证码';
        return;
      }
      if (!resetNewPassword.value) {
        error.message = '请输入新密码';
        return;
      }
      if (resetNewPassword.value !== resetConfirmPassword.value) {
        error.message = '两次密码不一致';
        return;
      }
      try {
        await store.resetPassword({
          email: resetEmail.value.trim(),
          code: resetCode.value.trim(),
          newPassword: resetNewPassword.value
        });
        resetSuccess.value = true;
        resetCode.value = '';
        resetNewPassword.value = '';
        resetConfirmPassword.value = '';
        setTimeout(() => {
          resetSuccess.value = false;
          store.state.authMode = 'login';
          form.email = resetEmail.value.trim();
          form.password = '';
        }, 2500);
      } catch (err) {
        error.message = err.message;
      }
    }

    async function resendResetCode() {
      if (resetCountdown.value > 0) return;
      error.message = '';
      try {
        await store.sendResetCode({ email: resetEmail.value.trim() });
        startResetCountdown();
      } catch (err) {
        error.message = err.message;
      }
    }

    return { store, form, error, registerStep, registerSuccess, verificationCode, resendCountdown, universitySuggestions, showPassword, showConfirmPassword, usernameHasChinese, resetStep, resetEmail, resetCode, resetNewPassword, resetConfirmPassword, resetCountdown, resetSuccess, showResetPassword, showResetConfirmPassword, submit, verifyCode, resendCode, filterUniversities, selectUniversity, onInstitutionBlur, goToReset, submitResetEmail, submitResetPassword, resendResetCode };
  },
  template: `
    <div v-if="store.state.showAuthModal" class="auth-overlay">
      <div class="auth-card">
        <button class="auth-close-btn" @click="store.closeAuthModal()">
          <AppIcon name="x" />
        </button>
        <div class="auth-brand-side">
          <div class="auth-brand-content">
            <div class="auth-brand-logo">Third</div>
            <h2 class="auth-brand-heading">{{ store.state.authMode === 'register' ? '加入我们' : '欢迎回来' }}</h2>
            <p class="auth-brand-desc">{{ store.state.authMode === 'register' ? '创建账号，开启学术探索之旅' : '登录以保留收藏、发布内容' }}</p>
          </div>
          <div class="auth-brand-deco"></div>
        </div>
        <div class="auth-form-side">
          <template v-if="registerSuccess">
            <div class="auth-success">
              <div class="auth-success-icon"><AppIcon name="check-circle" /></div>
              <h3>注册成功</h3>
              <p>欢迎加入，{{ form.username }}！</p>
            </div>
          </template>
          <template v-else-if="store.state.authMode === 'register' && registerStep === 'code'">
            <div class="auth-form-head">
              <h3>输入验证码</h3>
              <p>已发送到 <strong>{{ form.email }}</strong></p>
            </div>
            <label class="auth-field">
              <span class="auth-field-label">验证码</span>
              <input v-model="verificationCode" type="text" class="auth-field-input auth-code-input" placeholder="输入6位验证码" maxlength="6">
            </label>
            <span v-if="error.message" class="auth-error">{{ error.message }}</span>
            <div class="auth-btn-row">
              <button class="auth-btn-ghost" :disabled="resendCountdown > 0" @click="resendCode">
                {{ resendCountdown > 0 ? resendCountdown + 's 后重发' : '重新发送' }}
              </button>
              <button class="auth-btn-primary" :disabled="store.state.authSubmitting" @click="verifyCode">
                {{ store.state.authSubmitting ? '验证中...' : '完成注册' }}
              </button>
            </div>
          </template>
          <template v-else-if="store.state.authMode === 'reset'">
            <template v-if="resetSuccess">
              <div class="auth-success">
                <div class="auth-success-icon"><AppIcon name="check-circle" /></div>
                <h3>密码已重置</h3>
                <p>请使用新密码登录</p>
              </div>
            </template>
            <template v-else-if="resetStep === 'email'">
              <div class="auth-form-head">
                <h3>找回密码</h3>
                <p>输入注册时使用的邮箱，我们将发送验证码</p>
              </div>
              <label class="auth-field">
                <span class="auth-field-label">邮箱</span>
                <input v-model="resetEmail" type="email" class="auth-field-input" placeholder="输入你的注册邮箱">
              </label>
              <span v-if="error.message" class="auth-error">{{ error.message }}</span>
              <button class="auth-btn-primary auth-btn-block" :disabled="store.state.authSubmitting" @click="submitResetEmail">
                {{ store.state.authSubmitting ? '发送中...' : '发送验证码' }}
              </button>
              <button class="auth-forgot-link" @click="store.state.authMode = 'login'">返回登录</button>
            </template>
            <template v-else-if="resetStep === 'code'">
              <div class="auth-form-head">
                <h3>输入验证码</h3>
                <p>已发送到 <strong>{{ resetEmail }}</strong></p>
              </div>
              <label class="auth-field">
                <span class="auth-field-label">验证码</span>
                <input v-model="resetCode" type="text" class="auth-field-input auth-code-input" placeholder="输入6位验证码" maxlength="6">
              </label>
              <label class="auth-field">
                <span class="auth-field-label">新密码</span>
                <div class="auth-field-pw">
                  <input v-model="resetNewPassword" :type="showResetPassword ? 'text' : 'password'" class="auth-field-input" placeholder="设置新密码" @compositionend="resetNewPassword = resetNewPassword.replace(/[\u4e00-\u9fff]/g, '')" @input="resetNewPassword = resetNewPassword.replace(/[\u4e00-\u9fff]/g, '')">
                  <button type="button" class="auth-pw-toggle" @click="showResetPassword = !showResetPassword"><AppIcon :name="showResetPassword ? 'eye-off' : 'eye'" /></button>
                </div>
              </label>
              <label class="auth-field">
                <span class="auth-field-label">确认新密码</span>
                <div class="auth-field-pw">
                  <input v-model="resetConfirmPassword" :type="showResetConfirmPassword ? 'text' : 'password'" class="auth-field-input" placeholder="再次输入新密码" @compositionend="resetConfirmPassword = resetConfirmPassword.replace(/[\u4e00-\u9fff]/g, '')" @input="resetConfirmPassword = resetConfirmPassword.replace(/[\u4e00-\u9fff]/g, '')">
                  <button type="button" class="auth-pw-toggle" @click="showResetConfirmPassword = !showResetConfirmPassword"><AppIcon :name="showResetConfirmPassword ? 'eye-off' : 'eye'" /></button>
                </div>
              </label>
              <span v-if="error.message" class="auth-error">{{ error.message }}</span>
              <div class="auth-btn-row">
                <button class="auth-btn-ghost" :disabled="resetCountdown > 0" @click="resendResetCode">
                  {{ resetCountdown > 0 ? resetCountdown + 's 后重发' : '重新发送' }}
                </button>
                <button class="auth-btn-primary" :disabled="store.state.authSubmitting" @click="submitResetPassword">
                  {{ store.state.authSubmitting ? '重置中...' : '重置密码' }}
                </button>
              </div>
            </template>
          </template>
          <template v-else>
            <div class="auth-tabs">
              <button :class="['auth-tab', { active: store.state.authMode === 'login' }]" @click="store.state.authMode = 'login'">登录</button>
              <button :class="['auth-tab', { active: store.state.authMode === 'register' }]" @click="store.state.authMode = 'register'">注册</button>
            </div>
            <div class="auth-fields">
              <template v-if="store.state.authMode === 'login'">
                <label class="auth-field">
                  <span class="auth-field-label">邮箱</span>
                  <input v-model="form.email" type="email" class="auth-field-input" placeholder="输入你的邮箱地址">
                </label>
              </template>
              <template v-if="store.state.authMode === 'register'">
              <label class="auth-field">
                <span class="auth-field-label">用户名</span>
                <input v-model="form.username" type="text" class="auth-field-input" placeholder="输入你的学术昵称">
                <span v-if="usernameHasChinese" class="auth-hint">建议使用英文或拼音，部分邮件系统可能不支持中文用户名</span>
              </label>
                <label class="auth-field">
                  <span class="auth-field-label">邮箱</span>
                  <input v-model="form.email" type="email" class="auth-field-input" placeholder="输入你的邮箱地址">
                </label>
              </template>
              <label class="auth-field">
                <span class="auth-field-label">密码</span>
                <div class="auth-field-pw">
                  <input v-model="form.password" :type="showPassword ? 'text' : 'password'" class="auth-field-input" placeholder="设置一个不会忘的密码" @compositionend="form.password = form.password.replace(/[\u4e00-\u9fff]/g, '')" @input="form.password = form.password.replace(/[\u4e00-\u9fff]/g, '')">
                  <button type="button" class="auth-pw-toggle" @click="showPassword = !showPassword"><AppIcon :name="showPassword ? 'eye-off' : 'eye'" /></button>
                </div>
              </label>
              <label v-if="store.state.authMode === 'register'" class="auth-field">
                <span class="auth-field-label">确认密码</span>
                <div class="auth-field-pw">
                  <input v-model="form.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" class="auth-field-input" placeholder="再次输入密码" @compositionend="form.confirmPassword = form.confirmPassword.replace(/[\u4e00-\u9fff]/g, '')" @input="form.confirmPassword = form.confirmPassword.replace(/[\u4e00-\u9fff]/g, '')">
                  <button type="button" class="auth-pw-toggle" @click="showConfirmPassword = !showConfirmPassword"><AppIcon :name="showConfirmPassword ? 'eye-off' : 'eye'" /></button>
                </div>
              </label>
              <label v-if="store.state.authMode === 'register'" class="auth-field auth-field-uni">
                <span class="auth-field-label">所属大学（可选）</span>
                <input v-model="form.institution" type="text" class="auth-field-input" placeholder="搜索你的大学..." @input="filterUniversities" @blur="onInstitutionBlur">
                <ul v-if="universitySuggestions.length" class="auth-uni-list">
                  <li v-for="item in universitySuggestions" :key="item.name" @mousedown.prevent="selectUniversity(item.name)">{{ item.name }}</li>
                </ul>
              </label>
            </div>
            <span v-if="error.message" class="auth-error">{{ error.message }}</span>
            <button class="auth-btn-primary auth-btn-block" :disabled="store.state.authSubmitting" @click="submit">
              {{ store.state.authSubmitting ? '提交中...' : (store.state.authMode === 'register' ? '发送验证码' : '登录') }}
            </button>
            <button v-if="store.state.authMode === 'login'" class="auth-forgot-link" @click="goToReset">忘记密码？</button>
          </template>
        </div>
      </div>
    </div>
  `
};

export const PublishModal = {
  components: { AppIcon },
  setup() {
    const store = useAppStore();
    const publishType = ref(null);
    const isDragOver = ref(false);
    const selectedFile = ref(null);
    const fileError = ref('');
    const form = reactive({
      title: '',
      content: '',
      tags: '',
      description: ''
    });
    const error = reactive({ message: '' });

    function selectType(type) {
      publishType.value = type;
      error.message = '';
    }

    function goBack() {
      publishType.value = null;
      error.message = '';
      fileError.value = '';
    }

    function handleFileSelect(event) {
      fileError.value = '';
      const file = event.target.files[0];
      validateAndSetFile(file);
      if (fileError.value) event.target.value = '';
    }

    function handleFileDrop(event) {
      event.preventDefault();
      isDragOver.value = false;
      const file = event.dataTransfer.files[0];
      validateAndSetFile(file);
    }

    function validateAndSetFile(file) {
      fileError.value = '';
      if (!file) return;
      if (!file.name.match(/\.(pdf|doc|docx)$/i)) {
        fileError.value = '仅支持 PDF、DOC、DOCX 格式';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        fileError.value = '文件大小不能超过 10MB';
        return;
      }
      if (/[^\x00-\x7F]/.test(file.name)) {
        fileError.value = '文件名不支持中文或特殊字符，请重命名为英文/数字后再上传';
        return;
      }
      selectedFile.value = file;
    }

    function removeFile() {
      selectedFile.value = null;
    }

    async function submitPost() {
      error.message = '';
      if (!form.title.trim()) {
        error.message = '标题不能为空';
        return;
      }
      if (!form.content.trim()) {
        error.message = '内容不能为空';
        return;
      }
      try {
        await store.publishPost({
          title: form.title.trim(),
          content: form.content.trim(),
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
        });
      } catch (err) {
        error.message = err.message;
      }
    }

    async function submitPaper() {
      error.message = '';
      if (!form.title.trim()) {
        error.message = '标题不能为空';
        return;
      }
      if (!selectedFile.value) {
        error.message = '请上传论文文件';
        return;
      }
      try {
        const reader = new FileReader();
        const fileData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile.value);
        });

        await store.publishPaper({
          title: form.title.trim(),
          description: form.description.trim(),
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          fileData,
          fileName: selectedFile.value.name,
          contentType: selectedFile.value.type,
          institution: store.state.currentUser?.institution || ''
        });
      } catch (err) {
        error.message = err.message;
      }
    }

    function closeOnMask(event) {
      if (event.target === event.currentTarget) {
        store.closePublishModal();
      }
    }

    return {
      store, publishType, isDragOver, form, selectedFile, fileError, error,
      selectType, goBack, handleFileSelect, handleFileDrop, removeFile,
      submitPost, submitPaper, closeOnMask
    };
  },
  template: `
    <div v-if="store.state.showPublishModal" class="modal-mask" @click="closeOnMask">
      <div class="modal-panel publish-panel">
        <button class="auth-close-btn" @click="store.closePublishModal()">
          <AppIcon name="x" />
        </button>

        <template v-if="!publishType">
          <span class="eyebrow">Create New</span>
          <h3>发布新内容</h3>
          <div class="publish-type-grid">
            <button class="publish-type-card" @click="selectType('post')">
              <div class="publish-type-icon"><AppIcon name="message-square" /></div>
              <strong>发帖讨论</strong>
              <p>分享想法、吐槽、学习心得</p>
            </button>
            <button class="publish-type-card" @click="selectType('paper')">
              <div class="publish-type-icon"><AppIcon name="file-text" /></div>
              <strong>上传论文</strong>
              <p>上传 PDF / DOC 论文文件</p>
            </button>
          </div>
        </template>

        <template v-else-if="publishType === 'post'">
          <div class="publish-back" @click="goBack">
            <AppIcon name="arrow-left" />
            <span>返回选择</span>
          </div>
          <span class="eyebrow">Post</span>
          <h3>发帖讨论</h3>
          <label class="form-field">
            <span>标题</span>
            <input v-model="form.title" type="text" placeholder="给你的内容起个标题">
          </label>
          <label class="form-field">
            <span>内容</span>
            <textarea v-model="form.content" rows="6" placeholder="补充内容、摘要或者吐槽"></textarea>
          </label>
          <label class="form-field">
            <span>标签</span>
            <input v-model="form.tags" type="text" placeholder="论文, 作业, 速成, 熬夜">
          </label>
          <span v-if="error.message" class="form-error">{{ error.message }}</span>
          <div class="modal-actions">
            <button class="ghost-button" @click="goBack">返回</button>
            <button class="primary-button" :disabled="store.state.publishSubmitting" @click="submitPost">
              {{ store.state.publishSubmitting ? '发布中...' : '立即发布' }}
            </button>
          </div>
        </template>

        <template v-else-if="publishType === 'paper'">
          <div class="publish-back" @click="goBack">
            <AppIcon name="arrow-left" />
            <span>返回选择</span>
          </div>
          <span class="eyebrow">Paper</span>
          <h3>上传论文</h3>
          <label class="form-field">
            <span>论文标题</span>
            <input v-model="form.title" type="text" placeholder="论文标题">
          </label>
          <label class="form-field">
            <span>描述 / 摘要</span>
            <textarea v-model="form.description" rows="3" placeholder="简要描述论文内容（选填）"></textarea>
          </label>
          <div class="form-field">
            <span>论文文件</span>
            <div
              :class="['file-drop-zone', { 'has-file': selectedFile, 'drag-over': isDragOver, 'file-drop-zone-error': fileError }]"
              @click="$refs.fileInput.click()"
              @dragover.prevent="isDragOver = true"
              @dragleave.prevent="isDragOver = false"
              @drop="handleFileDrop"
            >
              <input ref="fileInput" type="file" accept=".pdf,.doc,.docx" style="display:none" @change="handleFileSelect">
              <template v-if="selectedFile">
                <div class="file-info">
                  <AppIcon name="file-text" />
                  <div>
                    <strong>{{ selectedFile.name }}</strong>
                    <span>{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
                  </div>
                </div>
                <button class="file-remove" @click.stop="removeFile">
                  <AppIcon name="x" />
                </button>
              </template>
              <template v-else>
                <div class="file-placeholder">
                  <AppIcon name="upload" />
                  <strong>点击或拖拽文件到此处</strong>
                  <span>支持 PDF、DOC、DOCX，最大 10MB</span>
                </div>
              </template>
            </div>
            <span v-if="fileError" class="form-error">{{ fileError }}</span>
          </div>
          <label class="form-field">
            <span>标签</span>
            <input v-model="form.tags" type="text" placeholder="论文, 毕业论文, 计算机科学">
          </label>
          <span v-if="error.message" class="form-error">{{ error.message }}</span>
          <div class="modal-actions">
            <button class="ghost-button" @click="goBack">返回</button>
            <button class="primary-button" :disabled="store.state.publishSubmitting" @click="submitPaper">
              {{ store.state.publishSubmitting ? '上传中...' : '上传论文' }}
            </button>
          </div>
        </template>
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
    const linkCopied = ref(false);

    function closeOnMask(event) {
      if (event.target === event.currentTarget) {
        store.closePostModal();
      }
    }

    async function copyLink() {
      if (!store.state.selectedPost) return;
      await navigator.clipboard.writeText(`${window.location.origin}/?post=${store.state.selectedPost.id}`);
      linkCopied.value = true;
      setTimeout(() => { linkCopied.value = false; }, 2000);
    }

    return { store, isFavorite, linkCopied, closeOnMask, copyLink, getInitial, formatLongDate, formatNumber };
  },
  template: `
    <div v-if="store.state.showPostModal" class="modal-mask" @click="closeOnMask">
      <div class="modal-panel detail-panel">
        <button class="auth-close-btn" @click="store.closePostModal()">
          <AppIcon name="x" />
        </button>
        <div v-if="store.state.detailLoading" class="detail-loading">加载中...</div>
        <template v-else-if="store.state.selectedPost">
          <span class="eyebrow">Post Detail</span>
          <h3 class="detail-title">{{ store.state.selectedPost.title }}</h3>
          <div class="detail-meta">
            <span class="avatar-circle">{{ getInitial(store.state.selectedPost.author) }}</span>
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
            <button class="ghost-button" :class="{ favorited: isFavorite }" @click="store.toggleFavorite(store.state.selectedPost.id)">
              <AppIcon :name="isFavorite ? 'bookmark-check' : 'bookmark'" />
              <span>{{ isFavorite ? '已收藏' : '收藏' }}</span>
            </button>
            <button class="primary-button" @click="copyLink">
              {{ linkCopied ? '已复制' : '复制链接' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  `
};

function loadMammoth() {
  return new Promise((resolve, reject) => {
    if (window.mammoth) return resolve(window.mammoth);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
    script.onload = () => resolve(window.mammoth);
    script.onerror = () => reject(new Error('mammoth.js 加载失败'));
    document.head.appendChild(script);
  });
}

const previewCache = new Map();
const PREVIEW_CACHE_TTL = 50 * 60 * 1000;

export const PaperPreview = {
  components: { AppIcon },
  props: {
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' }
  },
  setup(props) {
    const store = useAppStore();
    const loading = ref(true);
    const errorMsg = ref('');
    const previewType = ref('');
    const blobUrl = ref('');
    const htmlContent = ref('');

    function getExt(name) {
      if (!name) return '';
      return name.split('.').pop().toLowerCase();
    }

    function extractName(url) {
      if (!url) return '';
      const name = url.split('/').pop();
      const idx = name.indexOf('-');
      return idx >= 0 ? name.slice(idx + 1) : name;
    }

    const API = import.meta.env.VITE_API_URL || '/api';

    async function getSignedUrl() {
      const storagePath = props.fileUrl.replace('/api/files/', '');
      const resp = await fetch(`${API}/file-url/${storagePath}`, {
        headers: { Authorization: `Bearer ${store.state.token}` }
      });
      if (!resp.ok) throw new Error('获取文件链接失败');
      const data = await resp.json();
      return data.signedUrl;
    }

    async function loadFile() {
      if (!props.fileUrl) { loading.value = false; return; }

      const cached = previewCache.get(props.fileUrl);
      if (cached && Date.now() - cached.timestamp < PREVIEW_CACHE_TTL) {
        previewType.value = cached.previewType;
        blobUrl.value = cached.blobUrl || '';
        htmlContent.value = cached.htmlContent || '';
        loading.value = false;
        return;
      }

      loading.value = true;
      errorMsg.value = '';

      try {
        const ext = getExt(props.fileName);
        const signedUrl = await getSignedUrl();

        if (ext === 'pdf') {
          blobUrl.value = signedUrl;
          previewType.value = 'pdf';
        } else if (ext === 'docx') {
          const resp = await fetch(signedUrl);
          if (!resp.ok) throw new Error('文件下载失败');
          const buf = await resp.arrayBuffer();
          await loadMammoth();
          const result = await window.mammoth.convertToHtml({ arrayBuffer: buf });
          htmlContent.value = result.value;
          previewType.value = 'html';
        } else {
          previewType.value = 'download';
        }

        previewCache.set(props.fileUrl, {
          previewType: previewType.value,
          blobUrl: blobUrl.value,
          htmlContent: htmlContent.value,
          timestamp: Date.now()
        });
      } catch (e) {
        console.error('[PaperPreview]', e.message);
        errorMsg.value = '文件预览加载失败';
        previewType.value = 'download';
      } finally {
        loading.value = false;
      }
    }

    async function downloadFile() {
      try {
        const signedUrl = await getSignedUrl();
        const resp = await fetch(signedUrl);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = extractName(props.fileUrl) || 'paper';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        window.open(props.fileUrl, '_blank');
      }
    }

    onMounted(loadFile);
    onUnmounted(() => {
      if (blobUrl.value && !previewCache.has(props.fileUrl)) {
        URL.revokeObjectURL(blobUrl.value);
      }
    });

    return { loading, errorMsg, previewType, blobUrl, htmlContent, downloadFile, extractName };
  },
  template: `
    <div class="paper-preview">
      <div v-if="loading" class="paper-preview-loading">
        <div class="paper-preview-spinner"></div>
        <span>文件加载中...</span>
      </div>
      <div v-else-if="errorMsg && previewType === 'download'" class="paper-preview-unsupported">
        <AppIcon name="file-text" />
        <p>{{ errorMsg }}</p>
        <p class="paper-preview-filename">{{ extractName(fileUrl) }}</p>
        <button class="primary-button" @click="downloadFile">
          <AppIcon name="download" /> 下载文件
        </button>
      </div>
      <div v-else-if="previewType === 'download'" class="paper-preview-unsupported">
        <AppIcon name="file-text" />
        <p>该文件格式不支持在线预览</p>
        <p class="paper-preview-filename">{{ extractName(fileUrl) }}</p>
        <button class="primary-button" @click="downloadFile">
          <AppIcon name="download" /> 下载查看
        </button>
      </div>
      <iframe
        v-else-if="previewType === 'pdf'"
        :src="blobUrl"
        class="paper-preview-iframe"
      ></iframe>
      <div v-else-if="previewType === 'html'" class="paper-preview-html" v-html="htmlContent"></div>
    </div>
  `
};

export const DeleteConfirmModal = {
  components: { AppIcon },
  setup() {
    const store = useAppStore();
    const deleting = ref(false);

    async function confirmDelete() {
      deleting.value = true;
      try {
        await store.deletePaper(store.state.pendingDeleteId);
      } catch {
        // deletePaper already sets deleteError
      } finally {
        deleting.value = false;
      }
    }

    function closeOnMask(event) {
      if (event.target === event.currentTarget) {
        store.cancelDelete();
      }
    }

    return { store, deleting, confirmDelete, closeOnMask };
  },
  template: `
    <div v-if="store.state.showDeleteConfirm" class="modal-mask" @click="closeOnMask">
      <div class="modal-panel" style="max-width: 400px; text-align: center;">
        <h3>确认删除</h3>
        <p style="color: var(--text-secondary); margin: 12px 0 20px;">删除后将无法恢复，确定要删除这篇论文吗？</p>
        <p v-if="store.state.deleteError" style="color: #ef4444; margin-bottom: 12px; font-size: 14px;">{{ store.state.deleteError }}</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button class="ghost-button" @click="store.cancelDelete()">取消</button>
          <button
            class="primary-button"
            style="background: #ef4444;"
            :disabled="deleting"
            @click="confirmDelete"
          >{{ deleting ? '删除中...' : '确认删除' }}</button>
        </div>
      </div>
    </div>
  `
};
