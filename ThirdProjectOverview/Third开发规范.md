# THIRD 项目开发规范文档

**版本**：v1.0

**更新**：2026-04-13

**适用**：论文平台、用户系统、论文上传、展示、管理

**托管**：Vercel + Supabase PostgreSQL + Vercel Blob

**架构**：Vue3 + Vite + Express + Serverless 部署

------

# 1. 技术架构

|   层级   |        技术选型        |          用途          |
| :------: | :--------------------: | :--------------------: |
|   前端   |      Vue 3 + Vite      |      SPA 单页应用      |
|   后端   |  Express（单一入口）   |     统一 API 服务      |
|  数据库  |  Supabase PostgreSQL   |  用户信息、论文元数据  |
| 文件存储 | Vercel Blob（Private） | 论文 PDF / Word / 文档 |
|   认证   |  Supabase Auth + JWT   |  用户登录、注册、鉴权  |

------

# 2. 部署规则 ⚠️ 核心不可变规则

## 2.1 vercel.json 配置（禁止修改）

```json
{
  "version": 2,
  "cleanUrls": true,
  "builds": [
    { "src": "public/**", "use": "@vercel/static" },
    { "src": "server/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server/index.js" },
    { "src": "/src/(.*)", "dest": "/public/src/$1" },
    { "src": "/(.*)", "dest": "/public/$1" }
  ]
}
```

## 2.2 路由规则

|   路径   |           处理方            |         说明         |
| :------: | :-------------------------: | :------------------: |
| `/api/*` | Express (`server/index.js`) | **所有接口统一入口** |
| `/src/*` |        `public/src/`        |    前端 Vue 资源     |
|   `/*`   |          `public/`          |       前端页面       |

## 2.3 绝对禁止行为 ❌

以下行为会直接导致 **API 冲突 / 500 / 404 / 部署失败**：

- ❌ 禁止创建 `/api/xxx.js`
- ❌ 禁止创建 `/api/papers/xxx.js`
- ❌ 禁止创建 `/api/auth/xxx.js`
- ❌ 禁止在项目根目录出现 `/api/` 文件夹
- ❌ 禁止修改 `vercel.json` 路由规则

> 所有 API **必须写在 Express** 中，不使用 Vercel Serverless Functions

------

# 3. 项目目录结构

```plaintext
Third/
├── public/                  # 前端静态根目录（Vercel 托管）
│   ├── index.html           # 前端入口
│   ├── src/                 # Vue 3 源码
│   │   ├── app.js
│   │   ├── components/      # 组件
│   │   ├── pages/           # 页面
│   │   ├── store/           # 状态管理
│   │   ├── styles/          # 样式
│   │   └── utils/           # 工具函数
│   └── images/              # 图片资源
├── server/                  # Express 后端（唯一 API 入口）
│   ├── index.js             # ⚠️ 主入口，注册所有路由
│   ├── routes/              # 路由模块（推荐拆分）
│   │   ├── auth.js          # 登录 / 注册
│   │   ├── papers.js        # 论文 CRUD
│   │   ├── user.js          # 用户信息 / 收藏
│   │   └── posts.js         // 旧帖子模块
│   ├── middleware/          # 中间件（auth 等）
│   └── data/                # 数据工具类
├── vercel.json              # ⚠️ 禁止修改
├── .env.example             # 环境变量示例
└── package.json
```

------

# 4. API 接口规范

## 4.1 接口路由清单

```plaintext
# 论文
GET    /api/papers           获取论文列表（?tab=hot&search=&tag=）
POST   /api/papers           创建论文（需登录）
GET    /api/papers/:id       获取单篇论文
PUT    /api/papers/:id       修改论文（仅作者）
DELETE /api/papers/:id       删除论文（仅作者）
POST   /api/papers/:id/star  点赞 / 取消点赞

# 认证
POST   /api/auth/register    注册
POST   /api/auth/login       登录

# 用户
GET    /api/user/profile     获取当前用户信息
GET    /api/user/favorites   获取收藏列表
POST   /api/user/favorite/:id 收藏 / 取消收藏

# 上传
POST   /api/upload           上传论文文件（自动入库）
```

## 4.2 认证中间件（统一使用）

```js
async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    req.user = { id: decoded.userId, username: decoded.username };
    next();
  } catch {
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }
}
```

## 4.3 统一响应格式

```js
// 成功
res.status(200).json({ papers: [...] })
res.status(200).json({ paper: {...} })
res.status(200).json({ success: true })

// 失败
res.status(400/401/403/404/500).json({ error: '错误说明' })
```

------

# 5. 数据库规范（Supabase）

## 5.1 users 表（用户信息）

与 `auth.users` 强绑定

|    字段     |    类型     |            说明             |
| :---------: | :---------: | :-------------------------: |
|     id      |    uuid     | 主键，绑定 Supabase Auth ID |
|  username   |    text     |           用户名            |
| institution |    text     |     机构 / 学校（可选）     |
|  favorites  |    jsonb    |      收藏论文 ID 数组       |
| created_at  | timestamptz |          创建时间           |

## 5.2 papers 表（论文信息）

|    字段     |    类型     |       说明        |
| :---------: | :---------: | :---------------: |
|     id      |    uuid     |     论文主键      |
|   user_id   |    uuid     | 上传者 ID（外键） |
|    title    |    text     |       标题        |
| description |    text     |       摘要        |
|    tags     |   text[]    |     标签数组      |
|  file_url   |    text     | Vercel Blob 地址  |
| institution |    text     |     作者机构      |
|    stars    |   integer   |      点赞数       |
|    views    |   integer   |      阅读数       |
| starred_by  |   uuid[]    | 点赞用户 ID 数组  |
| created_at  | timestamptz |     上传时间      |

## 5.3 RLS 权限策略（已固化）

- **papers**：公开可读，登录可创建，仅作者可修改 / 删除
- **users**：公开可读，仅本人可修改

------

# 6. 文件存储规范（Vercel Blob）

## 6.1 规则

- 模式：private（私密）
- 用途：论文 PDF / DOCX / TXT
- 单文件限制：≤50MB
- 前端通过 `downloadUrl` 访问

## 6.2 上传流程

前端上传 → `/api/upload` → 存入 Vercel Blob → 返回 URL → 写入 `papers` 表

------

# 7. 环境变量（必须配置）

```plaintext
SUPABASE_URL
SUPABASE_ANON_KEY
BLOB_READ_WRITE_TOKEN
JWT_SECRET
```

------

# 8. Git 工作流

```
git add .
git commit -m "功能/修复说明"
git pull origin master --rebase
git push origin master
```

出现 `rejected`：

**必须先 pull --rebase，再 push**

------

# 9. 避坑指南

|   问题   |         原因         |         解决方案          |
| :------: | :------------------: | :-----------------------: |
|   404    |       路由错误       |    不修改 vercel.json     |
|   500    | /api 目录存在独立 JS |     删除 /api 文件夹      |
|  空白页  | 前端文件不在 public  | 确保 index.html 在 public |
| 部署失败 |     缺少环境变量     |      在 Vercel 配置       |
| 接口 401 |      Token 无效      |         重新登录          |

------

# 10. 新增功能标准流程

1. 写路由：`server/routes/xxx.js`
2. 引入路由：`server/index.js`
3. 使用：`app.use('/api/xxx', 路由)`
4. 测试接口
5. Git 提交 → 自动部署

------

# 11. 文档说明

本文档为 **THIRD 项目唯一开发、维护、交接标准**

所有新增功能、Bug 修复、配置修改必须遵循本规范。