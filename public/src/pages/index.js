import { computed } from 'vue';
import {
  FeedTabs,
  HeroBanner,
  InsightPanel,
  PostGrid,
  StatsStrip
} from '../components/index.js';
import { useAppStore } from '../store/appStore.js';

const HomePage = {
  components: { HeroBanner, StatsStrip, FeedTabs, PostGrid, InsightPanel },
  setup() {
    const store = useAppStore();
    const emptyTitle = computed(() =>
      store.state.activeFeed === 'favorite' && !store.isLoggedIn.value ? '登录后查看收藏' : '这个分区还没有内容'
    );
    const emptyDescription = computed(() =>
      store.state.activeFeed === 'favorite' && !store.isLoggedIn.value
        ? '先登录，再把喜欢的内容收进自己的垃圾柜。'
        : '可以先切换 tab，或者直接发布一篇新内容。'
    );

    return { store, emptyTitle, emptyDescription };
  },
  template: `
    <section class="view-shell">
      <HeroBanner
        badge="Home Feed"
        title="把设计图先落成一套 Vue3 首页"
        description="首页作为主工作台，包含头部信息、数据总览、内容 tab、推荐侧栏和详情弹层。当前先把结构完整搭好，后续我们再继续精修。"
        primary-label="立即发布"
        secondary-label="前往发现"
        @primary="store.openPublishModal()"
        @secondary="$router.push({ name: 'discover' })"
      />

      <StatsStrip :items="store.dashboardCards" />
      <FeedTabs />

      <section class="content-layout">
        <div class="page-panel">
          <PostGrid
            :posts="store.state.feedPosts"
            :loading="store.state.loadingFeed"
            :empty-title="emptyTitle"
            :empty-description="emptyDescription"
          />
        </div>

        <InsightPanel
          title="Trending Tags"
          description="侧栏保留趋势标签和热度精选，方便继续迭代成更强的信息架构。"
          :tags="store.trendingTags"
          :posts="store.featuredPosts.slice(0, 2)"
        />
      </section>
    </section>
  `
};

const DiscoverPage = {
  components: { HeroBanner, PostGrid, StatsStrip },
  setup() {
    const store = useAppStore();
    const categoryCards = computed(() =>
      store.trendingTags.value.slice(0, 4).map((tag, index) => ({
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
        title="回收站页先承接归档与二次整理"
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
    const suggestions = computed(() => store.trendingTags.value.slice(0, 6));
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

export const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/discover', name: 'discover', component: DiscoverPage },
  { path: '/recycle', name: 'recycle', component: RecyclePage },
  { path: '/search', name: 'search', component: SearchPage }
];
