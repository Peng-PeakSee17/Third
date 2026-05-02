import {
  createApp,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue';
import {
  RouterView,
  createRouter,
  createWebHistory
} from 'vue-router';
import {
  AppHeader,
  AuthModal,
  DeleteConfirmModal,
  PostDetailModal,
  PublishModal
} from './components/index.js';
import { routes } from './pages/index.js';
import { APP_STORE_KEY, createAppStore } from './store/appStore.js';
import { refreshIcons } from './utils/ui.js';

const router = createRouter({
  history: createWebHistory(),
  routes
});

const store = createAppStore(router);

const App = {
  components: {
    AppHeader,
    AuthModal,
    PublishModal,
    PostDetailModal,
    DeleteConfirmModal,
    RouterView
  },
  setup() {
    const slogans = [
      { zh: '站在局外，看清一切', en: 'Stand outside, see everything clearly' },
      { zh: '不是当事人，但比当事人更清醒', en: 'Not the party involved, but more clear-headed' },
      { zh: '万物的第三种观点', en: 'The Third View of Everything' },
      { zh: '不参与，但不缺席', en: 'Not participating, but not absent' }
    ];
    const sloganIndex = ref(0);
    const sloganFading = ref(false);
    let sloganTimer = null;

    watch(
      () => [store.state.activeFeed, store.state.searchQuery],
      () => {
        store.fetchFeedPosts();
      }
    );

    onMounted(async () => {
      await store.bootstrap();
      refreshIcons();

      const params = new URLSearchParams(window.location.search);
      const postId = params.get('post');
      if (postId) {
        store.openPost(postId);
      }

      sloganTimer = setInterval(() => {
        sloganFading.value = true;
        setTimeout(() => {
          sloganIndex.value = (sloganIndex.value + 1) % slogans.length;
          sloganFading.value = false;
        }, 600);
      }, 5000);
    });

    onUnmounted(() => {
      if (sloganTimer) clearInterval(sloganTimer);
    });

    return { store, slogans, sloganIndex, sloganFading };
  },
  template: `
    <div class="app-shell">
      <AppHeader />
      <div class="header-banner">
        <div class="banner-inner">
          <span class="slogan-line"></span>
          <div class="banner-slogan" :class="{ 'slogan-fade': sloganFading }">
            <p class="slogan-zh">{{ slogans[sloganIndex].zh }}</p>
            <span class="slogan-en">{{ slogans[sloganIndex].en }}</span>
          </div>
          <span class="slogan-line"></span>
        </div>
      </div>
      <div class="main-view">
        <RouterView />
      </div>

      <button class="floating-action" @click="store.openPublishModal()">
        <span>+</span>
      </button>

      <AuthModal />
      <PublishModal />
      <PostDetailModal />
      <DeleteConfirmModal />
    </div>
  `
};

router.afterEach(() => {
  refreshIcons();
});

const app = createApp(App);
app.provide(APP_STORE_KEY, store);
app.use(router);
app.mount('#app');