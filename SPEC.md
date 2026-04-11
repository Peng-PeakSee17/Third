# 学术垃圾收容所 - 项目规格

## 1. Concept & Vision

一个收录和展示"学术垃圾"的趣味平台——论文、作业、笔记凡是"不想承认是自己写的"都可以往这里丢。整体调性是自嘲 + 黑色幽默，界面风格却异常精致，形成反差萌。Dark theme，主色调深紫，氛围介于"正经学术"和"赛博废土"之间。

## 2. Design Language

- **Aesthetic**: 暗色学术 + 赛博朋克元素，带有一丝自嘲式幽默
- **Color Palette**:
  - Background: `#0f0d1a` (deep dark purple-black)
  - Card BG: `#1a1625` (dark purple)
  - Primary: `#8b5cf6` (violet)
  - Primary Light: `#a78bfa`
  - Accent: `#06d6a0` (mint green for highlights)
  - Text: `#e2e0ea` (off-white)
  - Text Muted: `#6b6880`
  - Border: `#2d2a3e`
- **Typography**:
  - Headings: "Noto Sans SC" (Chinese), weight 700
  - Body: "Noto Sans SC", weight 400
  - Monospace accents: "JetBrains Mono" (for tags/badges)
- **Motion**:
  - Entrance: fade-in + translateY(12px), 300ms ease-out, 50ms stagger
  - Hover: scale(1.02), 200ms ease
  - Cards: subtle glow on hover using box-shadow with primary color
- **Icons**: Lucide icons (via CDN)
- **Images**: Lucide icons for UI, placeholder avatars with initials

## 3. Layout & Structure

```
┌──────────────────────────────────────────────────────────┐
│  TopBar: Logo + Search bar + Login button                │
├─────────────┬────────────────────────────────────────────┤
│  Sidebar    │  Main Content                              │
│  - 首页      │  TabBar: 最新 | 热门 | 收藏                │
│  - 发现      │                                            │
│  - 回收站    │  Content Grid (cards)                     │
│  - 搜索      │                                            │
│  - 登录      │  FAB: ↑ 发表                               │
└─────────────┴────────────────────────────────────────────┘
```

- **Sidebar**: Fixed, 220px wide, dark with subtle border
- **Content**: Fluid, max-width 1200px centered
- **Cards**: Grid layout, responsive (1-3 columns)
- **Mobile**: Sidebar collapses to bottom tab bar

## 4. Features & Interactions

### Navigation
- Sidebar items highlight on active
- Hover: background lightens, icon shifts right 4px
- Click transitions with subtle fade

### Content Feed
- Three tabs: 最新 / 热门 / 收藏
- Tab switch: underline slides to active tab
- Cards show: thumbnail, title, author avatar+name, institution, stats
- Hover: card lifts (translateY -4px), subtle glow

### Post Detail (modal or page)
- Full content view with author info
- Like / Comment / Share actions
- Related posts below

### Search
- Expands on focus in sidebar
- Real-time filtering of posts

### Auth
- Login modal with username + password
- JWT stored in localStorage
- Protected actions (收藏) prompt login if not authenticated

### Publish (FAB)
- Floating button bottom-right
- Opens publish modal/form

## 5. Component Inventory

### NavItem
- States: default (icon + text, muted), hover (bg lighten, icon shifts), active (primary color, left border accent)
- Icon + label, vertical stack in sidebar

### PostCard
- States: default, hover (lift + glow), loading (skeleton)
- Thumbnail (120x80), title (2-line clamp), author row, stat row

### TabBar
- Underline indicator slides between tabs
- Active tab: primary color

### SearchBar
- Expandable, dark input with search icon
- Focus: border glows primary

### AuthModal
- Dark overlay, centered card
- Username + password inputs, submit button

### FAB
- Fixed bottom-right, primary gradient background
- Hover: scale up, shadow intensifies

## 6. Technical Approach

- **Frontend**: Vanilla HTML/CSS/JS, component-based structure
- **Backend**: Node.js + Express, REST API
- **Data**: JSON file-based storage (posts.json, users.json)
- **Auth**: JWT tokens, bcrypt password hashing
- **API Endpoints**:
  - `GET /api/posts` - list posts (query: tab, search)
  - `GET /api/posts/:id` - single post
  - `POST /api/posts` - create post (auth required)
  - `POST /api/auth/login` - login
  - `POST /api/auth/register` - register
  - `GET /api/user/favorites` - user's favorites (auth)
  - `POST /api/posts/:id/favorite` - toggle favorite (auth)
