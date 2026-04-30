# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**Third**（学术垃圾收容所）— 一个学术论文分享/托管平台。用户可注册登录、上传论文文件（PDF/DOCX/TXT）、浏览/搜索/点赞/收藏论文。核心理念是"第三视角的观察者聚集地"。

## 常用命令

```bash
npm install          # 安装依赖
npm run dev          # 开发模式：Vite (5173) + Express (3000) 并行启动
npm run build        # 前端构建，输出到 public/dist/
npm start            # 仅启动 Express 服务器
```

前端通过 Vite dev server 的 proxy 将 `/api` 请求代理到 Express `localhost:3000`。

## 技术栈

- **前端**：Vue 3（Options API，无 SFC，纯 JS template 字符串）+ Vue Router + Vite
- **后端**：Express（单一入口 `server/index.js`）
- **数据库**：Supabase PostgreSQL（`users`、`papers` 两张表，已开启 RLS）
- **文件存储**：服务器本地磁盘（`server/uploads/`）
- **认证**：Supabase Auth 注册 + JWT 鉴权
- **部署**：前端 Vercel 静态托管 + 后端自建服务器（PM2 + Nginx）

## 架构

```
Third/
├── public/              # 前端根目录（Vercel 托管静态文件）
│   ├── index.html       # SPA 入口
│   └── src/
│       ├── app.js       # Vue 应用挂载 + 路由 + 全局状态注入
│       ├── components/  # UI 组件（AppHeader, AuthModal, PublishModal, PostDetailModal）
│       ├── pages/       # 路由页面
│       ├── store/       # 全局状态（appStore，provide/inject 模式，非 Pinia）
│       ├── styles/      # CSS
│       └── utils/       # 工具函数（Lucide 图标刷新等）
├── server/              # Express 后端（部署到自建服务器）
│   ├── index.js         # 主入口：注册中间件、Supabase client、上传接口、文件下载、路由挂载
│   ├── routes/          # 按功能拆分：auth.js, papers.js, user.js, posts.js
│   ├── uploads/         # 上传文件存储（gitignore）
│   ├── middleware/      # 认证中间件 auth.js
│   └── data/            # JSON 数据文件 + store.js（旧数据层）
└── vercel.json          # Vercel 部署配置（前端静态托管）
```

### 数据流

1. 注册/登录 → Supabase Auth → JWT Token 返回前端
2. 上传论文 → POST `/api/upload` → 文件存 `server/uploads/` → 路径 `/api/files/xxx` 写入 `papers` 表
3. 下载论文 → GET `/api/files/:filename` → JWT 认证 → 服务器返回文件
4. 浏览论文 → GET `/api/papers` → 从 Supabase 读取元数据列表
5. 删除论文 → DELETE `/api/papers/:id` → 删除数据库记录 + 清理关联文件
6. 前端请求需登录的接口 → Authorization header 带 JWT → Express 中间件校验

## 部署规则

- **前端**：Vercel 静态托管（仅 `public/dist/`），`vercel.json` 配置 SPA fallback
- **后端**：自建服务器运行 Express，PM2 常驻 + Nginx 反向代理
- **禁止修改 `vercel.json`**
- **禁止在项目根目录创建 `/api/` 文件夹或任何 `/api/*.js` 文件**
- 所有 API 必须通过 Express 路由挂载：在 `server/routes/` 新增文件，然后在 `server/index.js` 中 `app.use('/api/xxx', routes)` 引入
- 前端静态文件必须放在 `public/` 目录下
- 前端 API 地址通过 `VITE_API_URL` 环境变量配置，不设则默认 `/api`

## 环境变量

参考 `.env.example`，需配置：`SUPABASE_URL`、`SUPABASE_ANON_KEY`、`JWT_SECRET`、`PORT`

前端构建时需设：`VITE_API_URL=http://服务器IP/api`

## API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/papers` | 论文列表（支持 ?tab=hot&search=&tag=） |
| POST | `/api/papers` | 创建论文 |
| GET/PUT/DELETE | `/api/papers/:id` | 论文详情/修改/删除 |
| POST | `/api/papers/:id/star` | 点赞/取消 |
| POST | `/api/upload` | 上传论文文件（base64，≤50MB） |
| GET | `/api/files/:filename` | 下载论文文件（需 JWT 认证） |
| GET | `/api/user/profile` | 当前用户信息 |
| GET/POST | `/api/user/favorites` / `/api/user/favorite/:id` | 收藏管理 |

## Git 工作流

主分支 `master`，rebase 模式：`git pull origin master --rebase` → `git push origin master`

## 开发约定

- 统一响应格式：成功 `{ papers: [...] }` / `{ success: true }`，失败 `{ error: '说明' }` 配对应 HTTP 状态码
- 认证中间件位于 `server/middleware/auth.js`，需要鉴权的路由引入即可
- 前端状态管理使用 provide/inject 模式（`appStore.js`），未使用 Vuex/Pinia
- 图标库使用 Lucide Icons（CDN 引入），DOM 更新后需调用 `refreshIcons()`
