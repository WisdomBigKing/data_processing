# Python Agent服务 Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
  gcc \
  && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 配置pip使用阿里云镜像源（加速下载）
RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ \
  && pip config set global.trusted-host mirrors.aliyun.com

# 安装Python依赖（增加超时时间）
RUN pip install --no-cache-dir --timeout=300 -r requirements.txt

# 复制应用代码
COPY . .

# 创建上传目录
RUN mkdir -p /app/uploads

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
