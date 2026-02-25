# LLM 配置指南

本文档说明如何配置大语言模型(LLM)服务，用于文章处理、数据分析等AI功能。

## 配置位置

### 1. Python服务配置（主要）

**文件位置**: `python_service/.env`

```env
# LLM API基础地址（不包含/chat/completions）
LLM_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# LLM API密钥
LLM_API_KEY=sk-39a16dc35f70417b8eeca844c89141ea

# LLM模型名称
LLM_MODEL=qwen-flash-2025-07-28
```

> **注意**: `.env` 文件已被 `.gitignore` 忽略，不会提交到代码仓库，请手动创建。

---

## 支持的LLM服务

### 阿里云通义千问（当前配置）

```env
LLM_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_API_KEY=你的阿里云API密钥
LLM_MODEL=qwen-flash-2025-07-28
```

可用模型：
- `qwen-flash-2025-07-28` - 快速响应
- `qwen-plus` - 增强版
- `qwen-turbo` - 平衡版
- `qwen-max` - 最强版

### OpenAI

```env
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=sk-你的OpenAI密钥
LLM_MODEL=gpt-4o-mini
```

可用模型：
- `gpt-4o-mini` - 高效经济
- `gpt-4o` - 最新版本
- `gpt-4-turbo` - 高性能
- `gpt-3.5-turbo` - 经济版

### Azure OpenAI

```env
LLM_API_URL=https://你的资源名.openai.azure.com/openai/deployments/你的部署名
LLM_API_KEY=你的Azure密钥
LLM_MODEL=gpt-4o-mini
```

### 其他兼容OpenAI API的服务

只要服务兼容OpenAI的 `/chat/completions` 接口，都可以使用：

```env
LLM_API_URL=https://你的服务地址/v1
LLM_API_KEY=你的密钥
LLM_MODEL=模型名称
```

---

## 生产环境部署

### Docker部署

在 `docker-compose.yml` 同级目录创建 `.env` 文件：

```env
# 数据库配置
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# LLM配置
LLM_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_API_KEY=你的API密钥
LLM_MODEL=qwen-flash-2025-07-28
```

或者在 `docker-compose.yml` 中直接配置环境变量：

```yaml
services:
  python-service:
    environment:
      - LLM_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
      - LLM_API_KEY=你的API密钥
      - LLM_MODEL=qwen-flash-2025-07-28
```

### 1Panel部署

参考 `DEPLOY_1PANEL.md`，在环境变量配置中添加：

```
LLM_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_API_KEY=你的API密钥
LLM_MODEL=qwen-flash-2025-07-28
```

---

## 验证配置

启动Python服务后，查看控制台输出：

```
============================================================
数据分析Agent服务 v2.0
============================================================
LLM API: https://dashscope.aliyuncs.com/compatible-mode/v1
LLM Model: qwen-flash-2025-07-28
API Key配置: 是                    <-- 显示"是"表示配置成功
最大迭代次数: 15
============================================================
```

如果显示 `API Key配置: 否`，请检查：
1. `.env` 文件是否存在于 `python_service` 目录
2. `LLM_API_KEY` 是否正确设置
3. 是否安装了 `python-dotenv`：`pip install python-dotenv`

---

## 使用LLM的功能

| 功能 | 说明 | API端点 |
|------|------|---------|
| 文章标题生成 | 根据文章内容生成引题、主题、副题、摘要、标签 | `/api/article/extract` |
| 文章处理 | 按要求改写文章并生成标题 | `/api/article/process` |
| 数据分析Agent | 智能分析Excel数据并生成报告 | `/api/analyze` |
| 报告生成 | 根据数据生成分析报告 | `/api/report/generate` |

---

## 安全提示

1. **不要在代码中硬编码API密钥**
2. **不要将 `.env` 文件提交到Git仓库**
3. **定期轮换API密钥**
4. **在生产环境使用环境变量或密钥管理服务**

---

## 故障排除

### 错误：LLM服务不可用

检查：
- API密钥是否正确
- API地址是否可访问
- 模型名称是否正确
- 网络是否能访问LLM服务

### 错误：LLM返回格式错误

可能原因：
- 模型返回了非JSON格式
- 请求超时
- API限流

解决方案：
- 检查API配额
- 增加超时时间
- 更换模型
