# Third项目数据存储

## 项目概述

本项目采用 **Supabase（数据库）+ Vercel Blob（文件存储）** 组合方案，实现用户系统、论文管理系统的数据持久化与文件存储，满足注册 / 登录、论文上传、公开访问、权限隔离等核心业务需求。

------

# 一、整体存储架构

|   存储类型   |          服务           |                   核心用途                    |
| :----------: | :---------------------: | :-------------------------------------------: |
| 关系型数据库 | **Supabase PostgreSQL** |      存储用户信息、论文元数据、业务数据       |
| 对象文件存储 |     **Vercel Blob**     | 存储用户上传的论文文件（PDF / Word / TXT 等） |
|   认证系统   |    **Supabase Auth**    |      内置用户注册、登录、Token、会话管理      |

------

# 二、Supabase 数据库设计

## 1. 数据库表清单

共 **2 张业务表**：

- `users`：用户信息表
- `papers`：论文信息表

## 2. users 表（用户信息）

存储用户注册资料、个人信息、收藏列表。

|   字段名    |    类型     |      默认值       |                说明                |
| :---------: | :---------: | :---------------: | :--------------------------------: |
|     id      |    uuid     | gen_random_uuid() | 主键，与 Supabase 认证用户 ID 绑定 |
|  username   |    text     |       NULL        |               用户名               |
| institution |    text     |       NULL        |          所属机构 / 学校           |
|  favorites  |    jsonb    |    '[]'::jsonb    |         收藏的论文 ID 数组         |
| created_at  | timestamptz |       now()       |              创建时间              |

**外键约束**

```sql
ALTER TABLE users
ADD CONSTRAINT fk_auth_users
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

## 3. papers 表（论文信息）

存储论文标题、描述、标签、热度、文件地址等元数据。

|   字段名    |    类型     |      默认值       |             说明              |
| :---------: | :---------: | :---------------: | :---------------------------: |
|     id      |    uuid     | gen_random_uuid() |          论文唯一 ID          |
|   user_id   |    uuid     |       NULL        |         上传者用户 ID         |
|    title    |    text     |       NULL        |           论文标题            |
| description |    text     |       NULL        |        论文摘要 / 简介        |
|  file_url   |    text     |       NULL        | 论文在 Vercel Blob 的访问链接 |
|    tags     |   text[]    |        {}         |         论文标签数组          |
|    stars    |   integer   |         0         |            点赞数             |
|    views    |   integer   |         0         |            阅读数             |
| institution |    text     |       NULL        |           作者机构            |
| created_at  | timestamptz |       now()       |           上传时间            |

**外键约束**

```sql
ALTER TABLE papers
ADD CONSTRAINT fk_papers_users
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

------

# 三、RLS 行级安全策略（权限控制）

所有表均 **开启 RLS**，确保数据安全与权限隔离。

## users 表权限

- 所有人可查看用户列表
- 用户仅可修改自己的信息

```sql
CREATE POLICY "Allow public read" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own row" ON users FOR UPDATE USING (auth.uid() = id);
```

## papers 表权限

- 所有人可查看所有论文
- 已登录用户可上传论文
- 仅作者可修改 / 删除自己的论文

```sql
CREATE POLICY "Allow public read" ON papers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON papers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authors can update own" ON papers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authors can delete own" ON papers FOR DELETE USING (auth.uid() = user_id);
```

------

# 四、Vercel Blob 文件存储

## 用途

专门存储 **用户上传的论文文件**（PDF、DOCX、TXT 等）。

## 为什么使用 Vercel Blob

- 轻量、免费额度充足
- 与前端项目无缝集成
- 提供稳定文件 URL
- 无需管理存储桶、无需复杂配置

## 存储内容

- 论文原文件
- 返回公开可访问 URL
- URL 存入 `papers.file_url`

## 环境变量

```plaintext
BLOB_READ_WRITE_TOKEN
```

------

# 五、各存储组件职责总结

|       组件        |             职责             |       不负责       |
| :---------------: | :--------------------------: | :----------------: |
| **Supabase Auth** |   注册、登录、会话、Token    |   不存储用户资料   |
|   **users 表**    |      存储用户资料、收藏      | 不存密码、不存文件 |
|   **papers 表**   | 论文元数据、标题、标签、热度 |    不存论文文件    |
|  **Vercel Blob**  |    论文文件存储、下载链接    |    不存业务数据    |

------

# 六、项目数据流

1. 用户注册 → Supabase Auth 创建账号 → 写入 `users` 表
2. 用户上传论文 → 文件存入 **Vercel Blob** → 获取 URL
3. 论文信息 + URL → 写入 `papers` 表
4. 前端展示论文 → 读取 `papers` 数据 → 通过 URL 加载文件
5. 权限控制 → RLS 自动校验用户身份

------

## 文档说明

本文档用于记录项目**所有存储结构、表设计、权限规则、存储分工**，可作为开发、维护、交接标准文档。