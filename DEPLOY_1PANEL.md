# 1Panel 部署指南

本文档详细说明如何将数据分析 Agent 项目部署到 1Panel。

## 📋 项目架构

项目包含两个服务：

- **Web 服务** (Next.js): 前端应用 + API 代理，端口 3000
- **Python 服务** (FastAPI): 数据分析 Agent 服务，端口 8000

数据库使用 SQLite，数据持久化通过 Docker 卷实现。

## 🔧 部署前准备

### 1. 服务器要求

- 操作系统：Linux (推荐 Ubuntu 20.04+)
- 内存：至少 2GB RAM
- 磁盘：至少 10GB 可用空间
- 已安装 1Panel

### 2. 上传项目代码

将项目代码上传到服务器，例如：

```bash
# 方式1：通过Git克隆
cd /opt
git clone <your-repo-url> data_processing

# 方式2：通过1Panel文件管理上传压缩包后解压
```

## 🚀 部署方式

### 方式一：使用 Docker Compose（推荐）

#### 步骤 1：进入 1Panel -> 容器 -> 编排

1. 点击「创建编排」
2. 选择「从 Compose 文件创建」
3. 名称填写：`data-analysis-agent`
4. 路径选择项目目录：`/opt/data_processing`

#### 步骤 2：配置环境变量

在 1Panel 中，进入「容器」->「编排」-> 找到刚创建的编排 -> 「编辑」

添加以下环境变量：

```
WEB_PORT=3000
PYTHON_PORT=8000
NEXT_PUBLIC_APP_URL=http://你的域名或IP:3000
JWT_SECRET=生成一个强随机字符串
LLM_API_KEY=你的OpenAI API Key（可选）
```

#### 步骤 3：初始化数据库

首次部署需要初始化数据库：

```bash
# 进入项目目录
cd /opt/data_processing

# 创建数据库目录
mkdir -p prisma

# 运行数据库迁移（在构建前）
docker run --rm -v $(pwd):/app -w /app node:20-alpine sh -c "npm ci && npx prisma generate && npx prisma db push"
```

#### 步骤 4：启动服务

```bash
# 在项目目录下执行
docker-compose up -d --build
```

或在 1Panel 中点击「启动」按钮。

---

### 方式二：分别创建容器

如果不想使用 Docker Compose，可以分别创建两个容器：

#### 创建 Python 服务容器

1. 进入 1Panel -> 容器 -> 创建容器
2. 配置：
   - 名称：`python-agent-service`
   - 镜像：使用 Dockerfile 构建或先构建镜像
   - 端口映射：`8000:8000`
   - 环境变量：
     ```
     LLM_API_URL=https://api.openai.com/v1/chat/completions
     LLM_API_KEY=你的API Key
     LLM_MODEL=gpt-4o-mini
     ```

构建 Python 服务镜像：

```bash
cd /opt/data_processing/python_service
docker build -t python-agent-service:latest .
```

#### 创建 Web 服务容器

1. 进入 1Panel -> 容器 -> 创建容器
2. 配置：
   - 名称：`data-analysis-web`
   - 镜像：使用 Dockerfile 构建
   - 端口映射：`3000:3000`
   - 环境变量：
     ```
     DATABASE_URL=file:/app/prisma/dev.db
     JWT_SECRET=你的JWT密钥
     NEXT_PUBLIC_APP_URL=http://你的域名:3000
     PYTHON_SERVICE_URL=http://python-agent-service:8000
     ```
   - 数据卷：
     - `/app/uploads` -> 本地目录
     - `/app/prisma` -> 本地目录（存放 SQLite 数据库）

构建 Web 服务镜像：

```bash
cd /opt/data_processing
docker build -t data-analysis-web:latest .
```

---

## 🌐 配置反向代理（可选但推荐）

### 使用 1Panel 的网站功能

1. 进入 1Panel -> 网站 -> 创建网站
2. 选择「反向代理」
3. 配置：
   - 域名：`your-domain.com`
   - 代理地址：`http://127.0.0.1:3000`
4. 可选：配置 SSL 证书（推荐）

### Nginx 配置示例

如果手动配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端应用
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 文件上传大小限制
    client_max_body_size 100M;
}
```

---

## 📁 数据持久化

### 重要目录说明

| 目录           | 说明          | 建议挂载位置                        |
| -------------- | ------------- | ----------------------------------- |
| `/app/prisma`  | SQLite 数据库 | `/opt/data_processing/data/prisma`  |
| `/app/uploads` | 用户上传文件  | `/opt/data_processing/data/uploads` |

### 备份建议

```bash
# 创建备份脚本 /opt/backup_data_analysis.sh
#!/bin/bash
BACKUP_DIR="/opt/backups/data_analysis"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
cp /opt/data_processing/data/prisma/dev.db $BACKUP_DIR/dev_$DATE.db

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/data_processing/data/uploads

# 保留最近7天的备份
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
```

在 1Panel 中设置定时任务执行此脚本。

---

## 🔍 常见问题

### Q1: 容器启动失败

检查日志：

```bash
docker-compose logs -f
# 或
docker logs data-analysis-web
docker logs python-agent-service
```

### Q2: 数据库连接错误

确保数据库文件存在且有正确权限：

```bash
ls -la /opt/data_processing/data/prisma/
chmod 666 /opt/data_processing/data/prisma/dev.db
```

### Q3: Python 服务无法连接

检查网络配置：

```bash
# 确保两个容器在同一网络
docker network ls
docker network inspect data_processing_app-network
```

### Q4: 文件上传失败

检查上传目录权限：

```bash
chmod -R 777 /opt/data_processing/data/uploads
```

### Q5: 内存不足

优化 Docker 资源限制，在 docker-compose.yml 中添加：

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          memory: 1G
  python-service:
    deploy:
      resources:
        limits:
          memory: 512M
```

---

## 🔄 更新部署

```bash
cd /opt/data_processing

# 拉取最新代码
git pull

# 重新构建并启动
docker-compose down
docker-compose up -d --build
```

---

## 📊 监控

### 在 1Panel 中监控

1. 进入「容器」查看容器状态
2. 查看 CPU、内存使用情况
3. 查看容器日志

### 健康检查

```bash
# 检查Web服务
curl http://localhost:3000/api/health

# 检查Python服务
curl http://localhost:8000/health
```

---

## 🛡️ 安全建议

1. **修改默认密钥**：务必修改 JWT_SECRET
2. **配置防火墙**：只开放必要端口（80/443）
3. **使用 HTTPS**：通过 1Panel 配置 SSL 证书
4. **定期备份**：设置自动备份任务
5. **更新依赖**：定期更新 Docker 镜像

---

## 📞 技术支持

如遇到问题，请检查：

1. Docker 日志
2. 1Panel 系统日志
3. 容器网络配置
4. 文件权限设置
