import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  AppIcon,
  Banner,
  FeedTabs,
  HeroBanner,
  InsightPanel,
  PostGrid,
  PaperPreview,
  StatsStrip
} from '../components/index.js';
import { useAppStore } from '../store/appStore.js';
import { formatDate, getInitial } from '../utils/ui.js';

const HomePage = {
  components: { Banner, PostGrid },
  setup() {
    const store = useAppStore();
    const sortedPosts = computed(() => {
      return [...store.state.allPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    const editorialPosts = computed(() => sortedPosts.value.slice(0, 4));
    const latestPosts = computed(() => sortedPosts.value.slice(0, 6));
    return { store, editorialPosts, latestPosts };
  },
  template: `
    <section class="view-shell">
      <Banner title="" subtitle="" variant="default" />

      <section class="content-layout two-column">
        <div class="column-main">
          <div class="section-header">
            <h2>社论</h2>
            <span class="section-desc">精选内容</span>
          </div>
          <PostGrid
            :posts="editorialPosts"
            :loading="store.state.loadingAll"
            empty-title="暂无社论内容"
            empty-description="等待内容投稿..."
          />
        </div>

        <aside class="column-side">
          <div class="section-header">
            <h2>最新动态</h2>
            <span class="section-desc">{{ new Date().toLocaleDateString() }}</span>
          </div>
          <div class="latest-list">
            <article v-for="post in latestPosts" :key="post.id" class="latest-item" @click="store.openPost(post.id)">
              <span class="latest-emoji">{{ post.title ? post.title.charAt(0) : '#' }}</span>
              <div class="latest-content">
                <strong>{{ post.title }}</strong>
                <span>{{ post.author }}</span>
              </div>
            </article>
          </div>
        </aside>
      </section>
    </section>
  `
};

const NewsPage = {
  components: { Banner, PostGrid, StatsStrip },
  setup() {
    const store = useAppStore();
    const newsPosts = computed(() => {
      return store.state.allPosts.filter(p => p.tags?.includes('news')).slice(0, 10);
    });
    return { store, newsPosts };
  },
  template: `
    <section class="view-shell">
      <Banner title="News" subtitle="新闻动态" variant="dark" />

      <div class="page-panel">
        <PostGrid
          :posts="newsPosts"
          :loading="store.state.loadingAll"
          empty-title="暂无新闻"
          empty-description="等待新闻动态..."
        />
      </div>
    </section>
  `
};

const ForumPage = {
  components: { Banner, PostGrid },
  setup() {
    const store = useAppStore();
    return { store };
  },
  template: `
    <section class="view-shell">
      <Banner title="FORUM" subtitle="暧昧区" variant="purple" />

      <div class="page-panel">
        <PostGrid
          :posts="store.state.allPosts.slice(0, 10)"
          :loading="store.state.loadingAll"
          empty-title="暂无讨论"
          empty-description="参与社区讨论..."
        />
      </div>
    </section>
  `
};

const SubmitPage = {
  setup() {
    const store = useAppStore();
    if (!store.isLoggedIn) {
      store.openAuthModal('login');
    }
    return { store };
  },
  template: `
    <section class="view-shell">
      <div v-if="store.isLoggedIn" class="submit-hero">
        <h2>投稿</h2>
        <p>将你的学术内容分享给社区。</p>
        <button class="primary-button" @click="store.openPublishModal()">发布新内容</button>
      </div>
      <div v-else class="user-guest-state">
        <div class="user-guest-icon">!</div>
        <h2>请先登录</h2>
        <p>登录后即可发布内容。</p>
        <button class="auth-btn-primary" @click="store.openAuthModal('login')">登录</button>
      </div>
    </section>
  `
};

const TrendingPage = {
  components: { Banner, PostGrid, StatsStrip },
  setup() {
    const store = useAppStore();
    const hotPosts = computed(() => {
      return [...store.state.allPosts]
        .sort((a, b) => (b.stars || 0) - (a.stars || 0))
        .slice(0, 10);
    });
    return { store, hotPosts };
  },
  template: `
    <section class="view-shell">
      <Banner title="TRENDING" subtitle="修罗场 - 热门内容" variant="red" />

      <div class="page-panel">
        <PostGrid
          :posts="hotPosts"
          :loading="store.state.loadingAll"
          empty-title="暂无热门"
          empty-description="等待热门内容..."
        />
      </div>
    </section>
  `
};

const UserPage = {
  components: { AppIcon, PostGrid },
  setup() {
    const store = useAppStore();
    const router = useRouter();

    watch(
      () => store.isLoggedIn,
      (val) => {
        if (val) store.fetchMyPapers();
      },
      { immediate: true }
    );

    const favoritePosts = computed(() =>
      store.state.currentUser
        ? store.state.allPosts.filter(p => (p.favorites || []).includes(store.state.currentUser.id))
        : []
    );

    function getFileName(url) {
      if (!url) return '';
      const name = url.split('/').pop();
      const idx = name.indexOf('-');
      return idx >= 0 ? name.slice(idx + 1) : name;
    }

    return { store, router, getInitial, formatDate, favoritePosts, getFileName };
  },
  template: `
    <section class="view-shell">
      <div v-if="store.isLoggedIn" class="user-profile-card">
        <div class="user-profile-header">
          <span class="avatar-circle large">{{ getInitial(store.state.currentUser?.username) }}</span>
          <div class="user-profile-info">
            <h2>{{ store.state.currentUser?.username }}</h2>
            <p>{{ store.state.currentUser?.institution || '学术难民' }}</p>
          </div>
          <button class="auth-btn-ghost" @click="store.logout()">退出登录</button>
        </div>

        <div class="user-tabs">
          <button
            class="user-tab"
            :class="{ active: store.state.userTab === 'papers' }"
            @click="store.setUserTab('papers')"
          >
            <strong>我的论文</strong>
            <span>{{ store.state.myPapers.length }} 篇</span>
          </button>
          <button
            class="user-tab"
            :class="{ active: store.state.userTab === 'posts' }"
            @click="store.setUserTab('posts')"
          >
            <strong>我的帖子</strong>
            <span>{{ store.myPosts.length }} 篇</span>
          </button>
          <button
            class="user-tab"
            :class="{ active: store.state.userTab === 'favorites' }"
            @click="store.setUserTab('favorites')"
          >
            <strong>我的收藏</strong>
            <span>{{ favoritePosts.length }} 篇</span>
          </button>
        </div>

        <div v-if="store.state.userTab === 'papers'" class="user-content">
          <div v-if="store.state.loadingMyPapers" class="grid-state">
            <div class="loading-card" v-for="item in 3" :key="item"></div>
          </div>
          <div v-else-if="store.state.myPapers.length" class="paper-list">
            <article v-for="paper in store.state.myPapers" :key="paper.id" class="paper-card clickable" @click="router.push({ name: 'paper', params: { id: paper.id } })">
              <div class="paper-card-icon"><AppIcon name="file-text" /></div>
              <div class="paper-card-content">
                <h4>{{ paper.title }}</h4>
                <p v-if="paper.description">{{ paper.description }}</p>
                <div class="paper-card-meta">
                  <span v-if="paper.file_url" class="paper-file-badge">
                    <AppIcon name="paperclip" />
                    {{ getFileName(paper.file_url) }}
                  </span>
                  <span>{{ formatDate(paper.created_at) }}</span>
                  <span><AppIcon name="eye" /> {{ paper.views || 0 }}</span>
                  <span><AppIcon name="star" /> {{ paper.stars || 0 }}</span>
                </div>
                <div v-if="paper.tags?.length" class="post-tags">
                  <span v-for="tag in paper.tags.slice(0, 4)" :key="tag" class="post-tag">#{{ tag }}</span>
                </div>
              </div>
              <button class="paper-delete-btn" @click.stop="store.deletePaper(paper.id)">
                <AppIcon name="trash-2" />
              </button>
            </article>
          </div>
          <div v-else class="empty-card">
            <strong>还没有上传论文</strong>
            <p>点击右下角 + 按钮上传你的第一篇论文</p>
          </div>
        </div>

        <div v-if="store.state.userTab === 'posts'" class="user-content">
          <PostGrid
            :posts="store.myPosts"
            empty-title="还没有发布帖子"
            empty-description="去论坛发一篇帖子吧"
          />
        </div>

        <div v-if="store.state.userTab === 'favorites'" class="user-content">
          <PostGrid
            :posts="favoritePosts"
            empty-title="还没有收藏内容"
            empty-description="浏览帖子时点击收藏按钮即可添加"
          />
        </div>
      </div>
      <div v-else class="user-guest-state">
        <div class="user-guest-icon">?</div>
        <h2>请先登录</h2>
        <p>登录后可以查看个人资料、收藏内容和发布记录。</p>
        <div class="user-guest-actions">
          <button class="auth-btn-primary" @click="store.openAuthModal('login')">登录</button>
          <button class="auth-btn-ghost" @click="store.openAuthModal('register')">注册新账号</button>
        </div>
      </div>
    </section>
  `
};

const DiscoverPage = {
  components: { HeroBanner, PostGrid, StatsStrip },
  setup() {
    const store = useAppStore();
    const categoryCards = computed(() =>
      store.trendingTags.slice(0, 4).map((tag, index) => ({
        title: tag.tag,
        count: tag.count,
        accent: ['Violet', 'Mint', 'Blue', 'Rose'][index] || 'Trend'
      }))
    );
    return { store, categoryCards };
  },
  template: `
    <section class="view-shell">
      <HeroBanner
        badge="Discover"
        title="发现页先做成内容分区和趋势入口"
        description="这里承接设计稿里的探索场景，用于展示热门标签、推荐内容和更强的视觉层次。"
        primary-label="查看热门"
        secondary-label="回到首页"
        @primary="store.setFeed('hot'); $router.push({ name: 'home' })"
        @secondary="$router.push({ name: 'home' })"
      />

      <section class="category-grid">
        <article v-for="item in categoryCards" :key="item.title" class="category-card">
          <span class="eyebrow">{{ item.accent }}</span>
          <strong>#{{ item.title }}</strong>
          <p>{{ item.count }} 篇内容正在被讨论</p>
        </article>
      </section>

      <div class="page-panel">
        <div class="section-head">
          <div>
            <span class="eyebrow">Featured Posts</span>
            <h3>高热度推荐</h3>
          </div>
        </div>
        <PostGrid
          :posts="store.featuredPosts"
          :loading="store.state.loadingAll"
          empty-title="暂无推荐内容"
          empty-description="数据一旦积累，这里会优先展示互动量更高的内容。"
        />
      </div>
    </section>
  `
};

const RecyclePage = {
  components: { HeroBanner, PostGrid },
  setup() {
    const store = useAppStore();
    return { store };
  },
  template: `
    <section class="view-shell">
      <HeroBanner
        badge="Recycle Bin"
        title="回收站页先承接归档与二次���理"
        description="回收站不是空页面，而是把低热度、熬夜赶稿、值得打捞的内容拆成多个区块，方便后续继续迭代成专题墙。"
        primary-label="去搜索"
        secondary-label="继续浏览"
        @primary="$router.push({ name: 'search' })"
        @secondary="$router.push({ name: 'home' })"
      />

      <section class="archive-grid">
        <article v-for="bucket in store.archiveBuckets" :key="bucket.title" class="archive-card">
          <div class="section-head">
            <div>
              <span class="eyebrow">Archive</span>
              <h3>{{ bucket.title }}</h3>
            </div>
          </div>
          <p class="archive-description">{{ bucket.description }}</p>
          <PostGrid
            :posts="bucket.posts"
            :loading="store.state.loadingAll"
            empty-title="当前区块暂无文章"
            empty-description="等更多内容进入回收流程后，这里会更饱满。"
            compact
          />
        </article>
      </section>
    </section>
  `
};

const SearchPage = {
  components: { HeroBanner, PostGrid },
  setup() {
    const store = useAppStore();
    const suggestions = computed(() => store.trendingTags.slice(0, 6));
    return { store, suggestions };
  },
  template: `
    <section class="view-shell">
      <HeroBanner
        badge="Search Center"
        title="搜索页独立出来做结果工作台"
        description="搜索页负责展示关键词建议、结果统计和筛选结果，形成真正可扩展的页面结构。"
        primary-label="清空关键词"
        secondary-label="回到首页"
        @primary="store.setSearchQuery('')"
        @secondary="$router.push({ name: 'home' })"
      />

      <section class="search-summary">
        <div class="search-summary-card">
          <span class="eyebrow">Current Keyword</span>
          <strong>{{ store.state.searchQuery || '未输入关键词' }}</strong>
          <p>匹配到 {{ store.searchResults.length }} 篇内容。</p>
        </div>
        <div class="search-summary-card wide">
          <span class="eyebrow">Suggestion</span>
          <div class="tag-cloud">
            <button
              v-for="tag in suggestions"
              :key="tag.tag"
              class="tag-cloud-item"
              @click="store.setSearchQuery(tag.tag)"
            >
              <span>#{{ tag.tag }}</span>
              <strong>{{ tag.count }}</strong>
            </button>
          </div>
        </div>
      </section>

      <div class="page-panel">
        <PostGrid
          :posts="store.searchResults"
          :loading="store.state.loadingAll"
          empty-title="没有匹配结果"
          empty-description="可以换个关键词，或者直接发布一篇新内容。"
        />
      </div>
    </section>
  `
};

const PaperDetailPage = {
  components: { AppIcon, PaperPreview },
  setup() {
    const store = useAppStore();
    const route = useRoute();
    const router = useRouter();

    function getFileName(url) {
      if (!url) return '';
      const name = url.split('/').pop();
      const idx = name.indexOf('-');
      return idx >= 0 ? name.slice(idx + 1) : name;
    }

    async function handleDelete() {
      if (!store.state.paperDetail) return;
      await store.deletePaper(store.state.paperDetail.id);
      router.push({ name: 'user' });
    }

    async function handleDownload() {
      const paper = store.state.paperDetail;
      if (!paper?.file_url) return;
      try {
        const resp = await fetch(paper.file_url, {
          headers: { Authorization: `Bearer ${store.state.token}` }
        });
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getFileName(paper.file_url) || 'paper';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        window.open(paper.file_url, '_blank');
      }
    }

    onMounted(() => {
      store.fetchPaperDetail(route.params.id);
    });

    watch(() => route.params.id, (newId) => {
      if (newId) store.fetchPaperDetail(newId);
    });

    return { store, getFileName, handleDelete, handleDownload, getInitial, formatDate };
  },
  template: `
    <section class="view-shell">
      <div v-if="store.state.loadingPaperDetail" class="paper-detail-loading">
        <div class="paper-preview-spinner"></div>
        <span>加载中...</span>
      </div>
      <div v-else-if="store.state.paperDetail" class="paper-detail">
        <header class="paper-detail-header">
          <button class="ghost-button" @click="$router.back()">
            <AppIcon name="arrow-left" /> 返回
          </button>
          <div class="paper-detail-header-actions">
            <button v-if="store.state.paperDetail.file_url" class="ghost-button" @click="handleDownload">
              <AppIcon name="download" /> 下载
            </button>
            <button
              v-if="store.state.paperDetail.user_id === store.state.currentUser?.id"
              class="ghost-button danger"
              @click="handleDelete"
            >
              <AppIcon name="trash-2" /> 删除
            </button>
          </div>
        </header>

        <div class="paper-detail-body">
          <aside class="paper-detail-sidebar">
            <h1 class="paper-detail-title">{{ store.state.paperDetail.title }}</h1>

            <div class="paper-detail-author">
              <span class="mini-avatar">{{ getInitial(store.state.paperDetail.institution?.charAt(0) || 'A') }}</span>
              <div>
                <strong>{{ store.state.paperDetail.institution || '匿名学术难民' }}</strong>
                <span>{{ formatDate(store.state.paperDetail.created_at) }}</span>
              </div>
            </div>

            <p v-if="store.state.paperDetail.description" class="paper-detail-desc">
              {{ store.state.paperDetail.description }}
            </p>

            <div v-if="store.state.paperDetail.tags?.length" class="post-tags">
              <span v-for="tag in store.state.paperDetail.tags" :key="tag" class="post-tag">#{{ tag }}</span>
            </div>

            <div class="paper-detail-stats">
              <span><AppIcon name="eye" /> {{ store.state.paperDetail.views || 0 }}</span>
              <span><AppIcon name="star" /> {{ store.state.paperDetail.stars || 0 }}</span>
            </div>

            <div v-if="store.state.paperDetail.file_url" class="paper-detail-file-badge">
              <AppIcon name="paperclip" />
              <span>{{ getFileName(store.state.paperDetail.file_url) }}</span>
            </div>
          </aside>

          <main class="paper-detail-preview">
            <PaperPreview
              v-if="store.state.paperDetail.file_url"
              :file-url="store.state.paperDetail.file_url"
              :file-name="getFileName(store.state.paperDetail.file_url)"
            />
            <div v-else class="paper-preview-unsupported">
              <AppIcon name="file-text" />
              <p>该论文没有附件</p>
            </div>
          </main>
        </div>
      </div>
      <div v-else class="empty-card">
        <strong>论文不存在或已被删除</strong>
        <button class="ghost-button" @click="$router.push({ name: 'user' })">返回个人页</button>
      </div>
    </section>
  `
};

export const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/news', name: 'news', component: NewsPage },
  { path: '/forum', name: 'forum', component: ForumPage },
  { path: '/submit', name: 'submit', component: SubmitPage },
  { path: '/trending', name: 'trending', component: TrendingPage },
  { path: '/user', name: 'user', component: UserPage },
  { path: '/paper/:id', name: 'paper', component: PaperDetailPage },
  { path: '/discover', name: 'discover', component: DiscoverPage },
  { path: '/recycle', name: 'recycle', component: RecyclePage },
  { path: '/search', name: 'search', component: SearchPage }
];