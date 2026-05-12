# VibeFile Cloud - 文件管理系统

VibeFile Cloud 是一个极简、现代、美观且高能的文件管理系统。基于 Vue 3 和 Node.js 开发，并采用 SQLite 作为底层存储，实现了全链路 100% 容器化部署（All-in-One）。

## 🛠 技术栈
- **Frontend**: Vue 3 + Vite + Tailwind CSS + Element Plus
- **Backend**: Node.js + Express.js + Prisma ORM
- **Database**: SQLite (集成在容器内部，无需外部数据库依赖)
- **Containerization**: Single Multi-Stage Dockerfile (无 docker-compose)

## 🚀 启动指南 (How to Run)

本系统采用 100% 容器化架构，请确保本地已运行 Docker Desktop。

### 一键构建并启动
在项目根目录下执行以下命令：

1. **构建 Docker 镜像**：
   ```bash
   docker build -t vibefile-cloud .
   ```

2. **运行 Docker 容器**：
   ```bash
   docker run -d -p 3000:3000 --name vibefile-app vibefile-cloud
   ```

3. 访问浏览器端：
   打开浏览器并打开：[http://localhost:3000](http://localhost:3000) 即可开始使用。

---

## 🔗 服务地址 (Services)
- **Frontend & Backend API**: [http://localhost:3000](http://localhost:3000)
- **Database File**: 储存在容器内的 `/app/environment/backend/prisma/dev.db`

---

## 🧪 测试账号
- **Admin**: `admin` / `123456`
- **User**: 可以通过注册页面自助注册，默认分配普通用户权限。

---

## 🌟 系统特色功能
1. **数据面板**：实时获取存储空间占用比例、上传文件后缀统计、近7天上传活跃趋势。
2. **文件管理**：支持点击、拖拽上传文件，实时进度条指示，搜索、下载及物理删除。
3. **账号管理**：管理员独享的 CRUD 功能，可以新建、编辑、重置密码及删除其他用户。
4. **系统设置**：管理员可以动态配置系统名称、单文件大小上限、自助注册开关、允许的文件格式白名单。非管理员仅只读显示，增强透明度。
