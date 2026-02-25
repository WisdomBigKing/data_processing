#!/bin/bash
# ============================================
# 服务器端部署脚本
# ============================================
# 用法: ./deploy.sh
# 
# 此脚本在服务器上执行，用于拉取代码并重启服务

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  数据分析Agent - 自动部署脚本${NC}"
echo -e "${GREEN}============================================${NC}"

# 项目目录（根据实际情况修改）
PROJECT_DIR="${DEPLOY_PATH:-/opt/data_processing}"

cd "$PROJECT_DIR"

echo -e "${YELLOW}[1/5] 拉取最新代码...${NC}"
git fetch origin
git reset --hard origin/main

echo -e "${YELLOW}[2/5] 停止旧容器...${NC}"
docker-compose down || true

echo -e "${YELLOW}[3/5] 构建新镜像...${NC}"
docker-compose build --no-cache

echo -e "${YELLOW}[4/5] 启动服务...${NC}"
docker-compose up -d

echo -e "${YELLOW}[5/5] 清理无用镜像...${NC}"
docker image prune -f

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ 部署完成！${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "服务状态："
docker-compose ps
