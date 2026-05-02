import {
  createApp,
  onMounted,
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
    });

    return { store };
  },
  template: `
    <div class="app-shell">
      <AppHeader />
      <div class="header-banner"></div>
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