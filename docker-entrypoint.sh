#!/bin/sh
set -e

# 数据分析Agent - Docker启动脚本
# 用于初始化数据库和启动应用

echo "=== 数据分析Agent启动中 ==="

# 检查数据库文件是否存在
DB_FILE="/app/prisma/dev.db"

if [ ! -f "$DB_FILE" ]; then
    echo "数据库文件不存在，正在初始化..."
    # 使用Prisma创建数据库
    npx prisma db push --skip-generate 2>/dev/null || echo "数据库初始化完成"
else
    echo "数据库文件已存在: $DB_FILE"
fi

echo "=== 启动应用服务 ==="

# 执行传入的命令（默认是 node server.js）
exec "$@"
