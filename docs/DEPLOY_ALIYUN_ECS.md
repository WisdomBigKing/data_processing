# 阿里云 ECS 服务器部署指南

> 本文档专为新手编写，详细说明如何将 Data Analysis Agent 项目部署到阿里云 ECS 服务器。

---

## 📋 服务器配置评估

### 您的服务器配置

| 配置项 | 您的配置              | 项目最低要求 | 推荐配置      | 评估        |
| ------ | --------------------- | ------------ | ------------- | ----------- |
| CPU    | 2核                   | 1核          | 2核+          | ✅ 满足     |
| 内存   | 2GB                   | 2GB          | 4GB+          | ⚠️ 勉强满足 |
| 系统盘 | 40GB ESSD             | 10GB         | 20GB+         | ✅ 充足     |
| 带宽   | 3Mbps                 | 1Mbps        | 5Mbps         | ✅ 基本满足 |
| 系统   | Alibaba Cloud Linux 3 | Linux        | Ubuntu/CentOS | ✅ 兼容     |

### 评估结论

**✅ 可以运行**，但需要注意以下几点：

1. **内存优化**：2GB 内存较紧张，建议配置 Swap 交换空间（虚拟内存）
2. **构建策略**：首次构建 Docker 镜像时内存占用较高，可能需要分步构建
3. **带宽限制**：3Mbps 带宽约等于 375KB/s，首次访问页面可能稍慢

### ⚠️ 重要提示

由于内存只有 2GB，**强烈建议**在部署前配置 2GB 的 Swap 空间，本文档会详细说明配置方法。

---

## 🎯 部署前准备清单

在开始部署之前，请确保：

- [ ] 已购买阿里云 ECS 服务器
- [ ] 已获得服务器的公网 IP 地址
- [ ] 已设置服务器 root 密码（或 SSH 密钥）
- [ ] 准备好 LLM API Key（如需 AI 分析功能）
- [ ] 本地电脑已安装 SSH 客户端（Windows 10/11 自带）

---

## 📚 部署步骤总览

```
步骤1: 连接服务器
    ↓
步骤2: 配置 Swap 交换空间（解决内存不足问题）
    ↓
步骤3: 安装 Docker 和 Docker Compose
    ↓
步骤4: 配置防火墙/安全组
    ↓
步骤5: 上传项目文件
    ↓
步骤6: 配置环境变量
    ↓
步骤7: 构建并启动服务
    ↓
步骤8: 初始化数据库
    ↓
步骤9: 验证部署
    ↓
步骤10: 配置开机自启（可选）
```

---

## 步骤1: 连接服务器

### 1.1 获取服务器信息

登录 [阿里云控制台](https://ecs.console.aliyun.com/)：

1. 点击左侧菜单「实例」
2. 找到您的服务器实例
3. 记录以下信息：
   - **公网 IP 地址**：例如 `47.95.xxx.xxx` // 8.146.205.197
   - **登录用户名**：默认为 `root` // root
   - **登录密码**：您设置的密码 // samsung360liuge.

### 1.2 使用 Windows PowerShell 连接

打开 **PowerShell**（Windows 搜索栏搜索 "PowerShell"）：

```powershell
# 替换为您的服务器公网IP
ssh root@47.95.xxx.xxx
```

首次连接会提示确认指纹，输入 `yes` 并回车：

```
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
```

然后输入密码（**输入时不会显示任何字符，这是正常的**），按回车。

### 1.3 连接成功标志

看到类似以下提示表示连接成功：

```
Welcome to Alibaba Cloud Elastic Compute Service !

[root@iZxxxxx ~]#
```

---

## 步骤2: 配置 Swap 交换空间

由于服务器只有 2GB 内存，**必须配置 Swap 空间**，否则构建镜像时可能内存不足。

### 2.1 检查当前内存和 Swap

```bash
free -h
```

输出示例：

```
              total        used        free      shared  buff/cache   available
Mem:          1.8Gi       200Mi       1.2Gi       8Mi       400Mi       1.5Gi
Swap:            0B          0B          0B    # 如果是0表示没有Swap
```

### 2.2 创建 2GB Swap 文件

```bash
# 创建 2GB 的 swap 文件（需要等待约1-2分钟）
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048

# 设置正确的权限
sudo chmod 600 /swapfile

# 格式化为 swap
sudo mkswap /swapfile

# 启用 swap
sudo swapon /swapfile
```

### 2.3 设置开机自动启用 Swap

```bash
# 添加到 fstab 实现开机自启
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
```

### 2.4 验证 Swap 配置

```bash
free -h
```

现在应该能看到 Swap 有 2GB：

```
              total        used        free
Swap:         2.0Gi          0B       2.0Gi
```

---

## 步骤3: 安装 Docker 和 Docker Compose

### 3.1 安装 Docker

Alibaba Cloud Linux 基于 CentOS/RHEL，使用以下命令安装：

```bash
# 安装必要的工具
sudo yum install -y yum-utils

# 添加阿里云 Docker 镜像源（国内访问更快）
sudo yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker 服务
sudo systemctl start docker

# 设置 Docker 开机自启
sudo systemctl enable docker
```

### 3.2 验证 Docker 安装

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker compose version
```

应该显示类似：

```
Docker version 24.0.x, build xxxxxxx
Docker Compose version v2.x.x
```

### 3.3 配置 Docker 镜像加速（重要！）

阿里云提供免费的容器镜像加速服务，**强烈建议配置**，否则拉取镜像会非常慢：

```bash
# 创建 Docker 配置目录
sudo mkdir -p /etc/docker

# 配置阿里云镜像加速器
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.m.daocloud.io",
    "https://dockerhub.azk8s.cn"
  ]
}
EOF

# 重启 Docker 使配置生效
sudo systemctl daemon-reload
sudo systemctl restart docker
```

> **提示**：阿里云有专属加速器，登录 [容器镜像服务控制台](https://cr.console.aliyun.com/cn-beijing/instances/mirrors) 获取您的专属加速地址，替换上面的镜像地址效果更好。

---

## 步骤4: 配置防火墙/安全组

### 4.1 配置阿里云安全组（必须！）

**这是最重要的一步**，否则外部无法访问您的服务。

1. 登录 [阿里云 ECS 控制台](https://ecs.console.aliyun.com/)
2. 点击您的实例名称，进入实例详情
3. 点击左侧「安全组」
4. 点击「配置规则」
5. 点击「手动添加」，添加以下规则：

| 规则方向 | 授权策略 | 协议类型  | 端口范围  | 授权对象  | 描述             |
| -------- | -------- | --------- | --------- | --------- | ---------------- |
| 入方向   | 允许     | 自定义TCP | 3000/3000 | 0.0.0.0/0 | Web服务          |
| 入方向   | 允许     | 自定义TCP | 8000/8000 | 0.0.0.0/0 | Python服务(可选) |
| 入方向   | 允许     | 自定义TCP | 80/80     | 0.0.0.0/0 | HTTP(如用Nginx)  |
| 入方向   | 允许     | 自定义TCP | 443/443   | 0.0.0.0/0 | HTTPS(如用Nginx) |

6. 点击「保存」

### 4.2 配置服务器防火墙

Alibaba Cloud Linux 默认可能启用了 firewalld：

```bash
# 检查防火墙状态
sudo systemctl status firewalld

# 如果防火墙正在运行，开放端口
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# 验证端口已开放
sudo firewall-cmd --list-ports
```

如果防火墙未运行（显示 inactive），可以跳过此步骤。

---

## 步骤5: 上传项目文件

### 方式A: 使用 Git 克隆（推荐）

如果项目已托管在 Git 仓库：

```bash
# 安装 Git
sudo yum install -y git

# 进入部署目录
cd /opt

# 克隆项目（替换为您的仓库地址）
git clone https://github.com/您的用户名/data_analysis_agent.git

# 进入项目目录
cd data_analysis_agent
```

### 方式B: 使用 SCP 上传（适合新手）

在 **本地 Windows PowerShell**（不是服务器终端）执行：

#### 步骤 B.1: 准备项目文件

1. 打开项目文件夹 `data_analysis_agent`
2. **删除以下目录**（减小体积，会在服务器重新生成）：
   - `node_modules/`
   - `.next/`
   - `python_service/__pycache__/`
3. 右键项目文件夹 → 发送到 → 压缩(zipped)文件夹
4. 得到 `data_analysis_agent.zip`

#### 步骤 B.2: 上传到服务器

```powershell
# 在本地 PowerShell 执行，替换路径和IP
scp C:\path\to\data_analysis_agent.zip root@47.95.xxx.xxx:/opt/
```

#### 步骤 B.3: 在服务器解压

```bash
# SSH 连接到服务器后执行
cd /opt

# 安装解压工具
sudo yum install -y unzip

# 解压项目
unzip data_analysis_agent.zip

# 进入项目目录
cd data_analysis_agent
```

### 方式C: 使用 SFTP 工具（图形界面）

推荐使用 [WinSCP](https://winscp.net/eng/download.php) 或 [FileZilla](https://filezilla-project.org/)：

1. 下载并安装 WinSCP
2. 新建站点：
   - 协议：SFTP
   - 主机名：您的服务器IP
   - 端口：22
   - 用户名：root
   - 密码：您的密码
3. 连接后，将项目文件夹拖放到 `/opt/` 目录

---

## 步骤6: 配置环境变量

### 6.1 创建环境变量文件

```bash
# 确保在项目目录
cd /opt/data_analysis_agent

# 创建 .env 文件
nano .env
```

### 6.2 编辑 .env 内容

复制以下内容到编辑器，**修改必须修改的项目**：

```bash
# ============================================
# 【必须修改】基础配置
# ============================================

# 应用访问地址（改为您的服务器公网IP）
NEXT_PUBLIC_APP_URL=http://47.95.xxx.xxx:3000

# JWT密钥（必须修改！用于用户登录加密）
# 请替换为32位以上的随机字符串
JWT_SECRET=请替换为您自己的随机密钥字符串至少32位

# ============================================
# 【可选】端口配置（默认即可）
# ============================================
WEB_PORT=3000
PYTHON_PORT=8000

# ============================================
# 【可选】LLM 配置（如需AI分析功能）
# ============================================
# OpenAI API
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=sk-您的OpenAI-API-Key
LLM_MODEL=gpt-4o-mini

# 或使用国内 API（如通义千问）
# LLM_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
# LLM_API_KEY=sk-您的通义千问-API-Key
# LLM_MODEL=qwen-max
```

### 6.3 保存文件

按以下步骤保存：

1. 按 `Ctrl + X` 退出
2. 按 `Y` 确认保存
3. 按 `Enter` 确认文件名

### 6.4 生成安全的 JWT 密钥

```bash
# 生成随机密钥
openssl rand -base64 32

# 复制输出的字符串（类似：K7Jd8sF3mN2pQ9xR4tY6uW1vZ0aB5cE=）
# 替换 .env 文件中的 JWT_SECRET 值
```

---

## 步骤7: 构建并启动服务

### 7.1 创建数据目录

```bash
# 创建持久化数据目录
mkdir -p /opt/data_analysis_agent/data/prisma
mkdir -p /opt/data_analysis_agent/data/uploads

# 设置权限
chmod -R 777 /opt/data_analysis_agent/data
```

### 7.2 构建 Docker 镜像

⚠️ **首次构建需要 10-20 分钟**，请耐心等待。

```bash
# 确保在项目目录
cd /opt/data_analysis_agent

# 构建并启动（-d 表示后台运行）
docker compose up -d --build
```

### 7.3 查看构建进度

```bash
# 实时查看日志
docker compose logs -f

# 按 Ctrl+C 退出日志查看
```

### 7.4 检查服务状态

```bash
docker compose ps
```

**正常输出：**

```
NAME                              STATUS
data_analysis_agent-web-1          Up
data_analysis_agent-python-service-1  Up
```

如果 STATUS 不是 `Up`，查看错误日志：

```bash
docker compose logs web
docker compose logs python-service
```

---

## 步骤8: 初始化数据库

首次部署需要初始化数据库表结构：

```bash
# 在 Web 容器内执行数据库初始化
docker compose exec web npx prisma db push
```

**成功输出：**

```
🚀  Your database is now in sync with your Prisma schema.
```

---

## 步骤9: 验证部署

### 9.1 测试服务连通性

```bash
# 测试 Web 服务
curl http://localhost:3000

# 测试 Python 服务
curl http://localhost:8000/health
```

### 9.2 浏览器访问

打开浏览器，访问：

```
http://您的服务器公网IP:3000
```

例如：`http://47.95.123.456:3000`

### 9.3 注册第一个用户

1. 点击「注册」
2. 填写用户信息
3. **重要**：第一个注册的用户名必须是「**卢金旭**」才能拥有管理员权限
4. 注册成功后即可登录使用

---

## 步骤10: 配置开机自启（可选但推荐）

### 10.1 创建 systemd 服务

```bash
sudo tee /etc/systemd/system/data-analysis-agent.service <<-'EOF'
[Unit]
Description=Data Analysis Agent
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/data_analysis_agent
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
```

### 10.2 启用开机自启

```bash
sudo systemctl daemon-reload
sudo systemctl enable data-analysis-agent
```

---

## 🔧 日常运维命令

### 查看服务状态

```bash
cd /opt/data_analysis_agent
docker compose ps
```

### 查看日志

```bash
# 查看所有日志
docker compose logs -f

# 只看 Web 服务日志
docker compose logs -f web

# 只看 Python 服务日志
docker compose logs -f python-service

# 查看最近100行日志
docker compose logs --tail=100
```

### 重启服务

```bash
# 重启所有服务
docker compose restart

# 只重启某个服务
docker compose restart web
docker compose restart python-service
```

### 停止服务

```bash
# 停止服务（保留数据）
docker compose down

# 停止服务并删除数据卷（⚠️ 会丢失所有数据！）
docker compose down -v
```

### 更新部署

```bash
cd /opt/data_analysis_agent

# 如果使用 Git，先拉取最新代码
git pull

# 重新构建并启动
docker compose down
docker compose up -d --build

# 如果数据库结构有变化
docker compose exec web npx prisma db push
```

---

## 💾 数据备份

### 重要数据位置

| 数据类型 | 路径                    | 重要性          |
| -------- | ----------------------- | --------------- |
| 数据库   | Docker 卷 `sqlite_data` | ⭐⭐⭐ 必须备份 |
| 上传文件 | Docker 卷 `web_uploads` | ⭐⭐ 建议备份   |

### 手动备份

```bash
# 创建备份目录
mkdir -p /opt/backups

# 备份数据库（从 Docker 卷复制）
docker cp data_analysis_agent-web-1:/app/prisma/dev.db /opt/backups/dev_$(date +%Y%m%d).db

# 备份上传文件
docker cp data_analysis_agent-web-1:/app/uploads /opt/backups/uploads_$(date +%Y%m%d)
```

### 自动备份脚本

```bash
# 创建备份脚本
cat > /opt/backup_data_analysis.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/data_analysis"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
docker cp data_analysis_agent-web-1:/app/prisma/dev.db $BACKUP_DIR/dev_$DATE.db

# 备份上传文件
docker cp data_analysis_agent-web-1:/app/uploads $BACKUP_DIR/uploads_$DATE

# 清理7天前的备份
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

# 添加执行权限
chmod +x /opt/backup_data_analysis.sh

# 测试运行
/opt/backup_data_analysis.sh
```

### 设置定时备份

```bash
# 编辑定时任务
crontab -e

# 添加以下行（每天凌晨3点备份）
0 3 * * * /opt/backup_data_analysis.sh >> /var/log/backup.log 2>&1
```

---

## 🔍 常见问题排查

### Q1: 构建时内存不足 (Killed)

**现象**：构建过程中出现 `Killed` 或 `npm ERR!`

**解决方案**：

```bash
# 确认 Swap 已启用
free -h

# 如果 Swap 为 0，请参考步骤2配置 Swap

# 可以尝试单独构建镜像
docker compose build web --no-cache
docker compose build python-service --no-cache
docker compose up -d
```

### Q2: 无法访问网页

**排查步骤**：

```bash
# 1. 检查容器是否运行
docker compose ps

# 2. 检查端口是否监听
netstat -tlnp | grep 3000

# 3. 检查防火墙
sudo firewall-cmd --list-ports

# 4. 检查阿里云安全组是否开放3000端口（最常见原因！）
```

### Q3: 服务启动后立即退出

**查看错误日志**：

```bash
docker compose logs web
docker compose logs python-service
```

**常见原因**：

- 环境变量配置错误
- 端口被占用
- 数据库文件权限问题

### Q4: 数据库错误

```bash
# 检查数据库文件
docker compose exec web ls -la /app/prisma/

# 重新初始化数据库
docker compose exec web npx prisma db push --force-reset
```

### Q5: Python 服务连接失败

**检查服务是否正常**：

```bash
# 检查 Python 服务日志
docker compose logs python-service

# 测试 Python 服务
curl http://localhost:8000/health
```

### Q6: 磁盘空间不足

```bash
# 查看磁盘使用
df -h

# 清理 Docker 未使用的资源
docker system prune -a

# 清理未使用的卷
docker volume prune
```

---

## 🛡️ 安全建议

### 必做项

- [x] 修改默认的 `JWT_SECRET`
- [x] 配置阿里云安全组，只开放必要端口
- [x] 定期备份数据

### 建议项

- [ ] 配置域名 + HTTPS
- [ ] 将 8000 端口从安全组移除（仅内部通信）
- [ ] 配置 fail2ban 防止暴力破解
- [ ] 定期更新系统和 Docker

### 配置 HTTPS（推荐）

如果有域名，建议配置 Nginx + SSL：

```bash
# 安装 Nginx
sudo yum install -y nginx

# 安装 Certbot
sudo yum install -y certbot python3-certbot-nginx

# 申请证书（替换为您的域名）
sudo certbot --nginx -d your-domain.com
```

---

## 📊 性能优化建议

由于服务器内存只有 2GB，建议：

1. **监控内存使用**：

   ```bash
   # 实时监控
   watch -n 1 free -h

   # 或使用 htop
   sudo yum install -y htop
   htop
   ```

2. **限制 Docker 内存**（可选）：
   在 `docker-compose.yml` 中添加：

   ```yaml
   services:
     web:
       deploy:
         resources:
           limits:
             memory: 800M
     python-service:
       deploy:
         resources:
           limits:
             memory: 600M
   ```

3. **定期清理**：
   ```bash
   # 清理 Docker 缓存
   docker system prune -f
   ```

---

## 📞 需要帮助？

如遇到问题，请提供以下信息便于排查：

1. `docker compose logs` 的输出
2. `free -h` 的输出
3. `docker compose ps` 的输出
4. 具体的错误信息或截图

---

_文档版本: 1.0.0 | 适用于阿里云 ECS + Alibaba Cloud Linux 3_
_最后更新: 2026-02-12_
