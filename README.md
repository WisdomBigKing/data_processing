# 数据分析 Agent - AI 驱动的智能数据分析平台

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776ab?style=flat-square&logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.1-2d3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=flat-square&logo=docker)](https://www.docker.com/)

一个功能强大的企业级数据分析平台，集成 AI Agent 自动化分析、Excel 智能处理、专业报告生成、图像编辑等多种功能。

[功能特性](#-核心功能) • [技术栈](#️-技术栈) • [快速开始](#-快速开始) • [部署指南](#-部署指南) • [使用文档](#-功能详解)

</div>

---

## 📋 目录

- [项目简介](#项目简介)
- [核心功能](#-核心功能)
- [技术栈](#️-技术栈)
- [系统架构](#️-系统架构)
- [快速开始](#-快速开始)
- [部署指南](#-部署指南)
- [功能详解](#-功能详解)
- [API 文档](#-api-文档)
- [开发指南](#️-开发指南)
- [常见问题](#-常见问题)
- [更新日志](#-更新日志)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

---

## 项目简介

**数据分析 Agent** 是一个基于 AI 技术的现代化数据分析平台，旨在简化数据分析流程，提高分析效率。平台采用前后端分离架构，结合 ReAct Agent 模式，实现智能化的数据分析和报告生成。

### 🎯 核心优势

- **🤖 AI 驱动**: 基于大语言模型的 ReAct Agent，自主规划分析步骤
- **📊 全自动化**: 从数据上传到报告生成，全流程自动化处理
- **🎨 专业报告**: 支持 Word、PPT 格式的专业分析报告生成
- **🔧 Excel 处理**: 内置专业 Excel 数据处理引擎，支持复杂计算
- **🖼️ 图像编辑**: 集成强大的图像编辑器，支持 PDF 导出、OCR 识别等
- **📈 数据可视化**: 自动生成图表，支持多种图表类型
- **🔐 企业级安全**: 完整的用户认证、权限管理、数据隔离
- **🚀 高性能**: Docker 容器化部署，支持水平扩展

### 🌟 适用场景

- 企业数据分析与报告自动化
- 科研数据处理与可视化
- Excel 数据批量处理
- 数据质量检查与清洗
- 商业智能分析
- 教育培训数据分析

---

## 🚀 核心功能

### 1️⃣ 智能数据分析 Agent

基于 **ReAct (Reasoning + Acting)** 架构的 AI Agent，能够自主思考、决策和执行数据分析任务。

#### 内置分析工具（10个）

| 工具名称 | 功能描述 | 应用场景 |
|---------|---------|----------|
| **load_data** | 加载数据文件 | 支持 CSV、Excel、JSON、TXT 格式 |
| **data_overview** | 数据概览 | 快速了解数据形状、类型、缺失值 |
| **describe_numeric** | 数值列统计 | 计算均值、标准差、分位数等 |
| **describe_categorical** | 分类列统计 | 统计唯一值、频率分布 |
| **correlation_analysis** | 相关性分析 | 发现变量间关联关系 |
| **detect_outliers** | 异常值检测 | 使用 IQR 方法检测异常值 |
| **group_analysis** | 分组分析 | 按维度分组统计（类似 SQL GROUP BY） |
| **data_quality_check** | 数据质量检查 | 检查缺失值、重复值、常量列等 |
| **generate_insight** | 生成洞察 | 记录分析过程中的重要发现 |
| **final_answer** | 输出结果 | 返回最终分析结论 |

#### Agent 特性

- ✅ 自主规划分析步骤
- ✅ 支持自然语言分析需求
- ✅ 自动选择合适的分析方法
- ✅ 生成结构化分析报告
- ✅ 支持多轮迭代优化
- ✅ 完整的思考过程记录

### 2️⃣ Excel 智能处理引擎

专业的 Excel 数据处理模块，支持复杂的数据计算和转换。

#### 处理能力

- **数据解析**: 自动识别 Excel 文件结构，支持多 Sheet
- **数据分组**: 智能识别数据组（B组、E组等）
- **线性计算**: 支持自定义斜率的线性拟合
  - B组: `y3 = -0.4823 × x1`
  - E组: `y4 = 0.4557 × x2 + b`
- **非线性分析**: 计算非线性部分
  - `y5 = y1 - y3` (B组非线性)
  - `y6 = y2 - y4` (E组非线性)
- **结果导出**: 生成包含计算结果和公式说明的 Excel 文件

### 3️⃣ 专业报告生成系统

基于模板的报告生成引擎，支持 Word 和 PPT 两种格式。

#### 报告内容

- **封面页**: 报告标题、副标题、生成时间
- **数据概览**: 数据来源、数据规模、数据质量
- **分析结果**: 统计分析、相关性分析、异常检测
- **数据洞察**: AI 生成的关键发现和建议
- **可视化图表**: 自动生成的数据图表
- **附录**: 详细数据表格、技术说明

### 4️⃣ 图像编辑器 Pro

集成的专业图像编辑工具，功能丰富且易用。包含 24 个组件，提供完整的图像编辑功能。

#### 核心功能

| 功能模块 | 具体功能 |
|---------|----------|
| **基础编辑** | 裁剪、旋转、缩放、翻转 |
| **图层管理** | 多图层支持、图层顺序调整、锁定/隐藏 |
| **绘图工具** | 矩形、圆形、线条、自由绘制、文本 |
| **颜色工具** | 颜色选择器、渐变编辑器、透明度调整 |
| **滤镜效果** | 模糊、锐化、亮度、对比度、饱和度 |
| **文本工具** | 多种字体、字号、颜色、对齐方式 |
| **变换工具** | 精确位置、尺寸、旋转角度控制 |
| **对齐工具** | 左对齐、居中、右对齐、分布 |
| **路径工具** | 联集、交集、差集、排除 |
| **AI 助手** | AI 设计建议、智能优化 |
| **OCR 识别** | 图片文字识别（基于 Tesseract.js） |
| **图表生成** | 柱状图、折线图、饼图等 |
| **PDF 导出** | 支持导出为 PDF 格式 |
| **导出选项** | PNG、JPEG、SVG、PDF 多格式导出 |

### 5️⃣ 用户管理系统

完整的用户认证和权限管理系统。

- **用户注册/登录**: 邮箱密码认证
- **会话管理**: 基于 Token 的会话机制，7天有效期
- **密码加密**: 使用 bcrypt 加密存储
- **权限控制**: 用户角色管理（user/admin）
- **路由保护**: 中间件自动保护受限路由

### 6️⃣ 文件管理系统

安全的文件上传、存储和管理。

- **文件上传**: 拖拽上传，支持多文件
- **格式支持**: CSV、Excel (.xlsx/.xls)、JSON、TXT
- **大小限制**: 最大 50MB
- **用户隔离**: 每个用户独立的文件空间

### 7️⃣ 任务管理系统

异步任务处理和进度跟踪。

- 创建分析任务
- 实时进度更新（0-100%）
- 任务历史记录
- 错误信息记录
- 结果下载

---

## 🛠️ 技术栈

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 16.1.1 | React 框架，支持 SSR/SSG |
| **React** | 19.2.3 | UI 库 |
| **TypeScript** | 5.x | 类型安全 |
| **TailwindCSS** | 4.x | CSS 框架 |
| **Zustand** | 5.0.9 | 状态管理 |
| **React Query** | 5.90.16 | 数据获取和缓存 |
| **React Hook Form** | 7.70.0 | 表单管理 |
| **Zod** | 4.3.5 | 数据验证 |
| **Fabric.js** | 7.1.0 | 图像编辑引擎 |
| **Tesseract.js** | 7.0.0 | OCR 文字识别 |
| **pdf-lib** | 1.17.1 | PDF 生成 |
| **pdfjs-dist** | 5.4.530 | PDF 解析 |
| **Lucide React** | 0.562.0 | 图标库 |

### 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| **FastAPI** | 0.109.0 | Python Web 框架 |
| **Uvicorn** | 0.27.0 | ASGI 服务器 |
| **Pandas** | 2.2.0 | 数据处理 |
| **NumPy** | 1.26.3 | 数值计算 |
| **httpx** | 0.26.0 | HTTP 客户端 |
| **Pydantic** | 2.5.3 | 数据验证 |
| **openpyxl** | 3.1.2 | Excel 读写 |
| **python-docx** | 1.1.0 | Word 文档生成 |
| **python-pptx** | 1.0.2 | PPT 文档生成 |

### 数据库与 ORM

| 技术 | 版本 | 用途 |
|------|------|------|
| **Prisma** | 6.19.1 | ORM 框架 |
| **SQLite** | - | 轻量级数据库 |

### 认证与安全

| 技术 | 版本 | 用途 |
|------|------|------|
| **bcryptjs** | 3.0.3 | 密码加密 |
| **jsonwebtoken** | 9.0.3 | JWT 生成和验证 |
| **uuid** | 13.0.0 | 唯一 ID 生成 |

---

## 🏗️ 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户浏览器                                │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/HTTP
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx 反向代理 (可选)                          │
│                      端口: 80/443                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Web 服务                             │
│                        端口: 3000                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  前端页面     │  │  API 路由    │  │  中间件      │          │
│  │  (React)     │  │  (/api/*)    │  │  (Auth)      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Prisma ORM  │  │  文件上传    │  │  会话管理    │          │
│  └──────┬───────┘  └──────────────┘  └──────────────┘          │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ SQLite 数据库 │                                               │
│  └──────────────┘                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP (内部网络)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Python FastAPI 服务                             │
│                        端口: 8000                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  数据分析     │  │  Excel 处理  │  │  报告生成    │          │
│  │  Agent        │  │  引擎        │  │  系统        │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │              10个分析工具                          │          │
│  │  load_data | data_overview | describe_numeric    │          │
│  │  correlation | outliers | group_analysis ...     │          │
│  └──────────────────────────────────────────────────┘          │
│                         │                                        │
│                         ▼                                        │
│  ┌──────────────────────────────────────────────────┐          │
│  │         LLM API (OpenAI / 兼容接口)               │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ 快速开始

### 环境要求

- **Node.js**: 20.x 或更高版本
- **Python**: 3.11 或更高版本
- **npm**: 9.x 或更高版本
- **Docker**: 20.x 或更高版本（生产部署）
- **Docker Compose**: 2.x 或更高版本（生产部署）

### 本地开发

#### 1. 克隆项目

```bash
git clone <repository-url>
cd data_analysis_agent
```

#### 2. 安装前端依赖

```bash
npm install
```

#### 3. 安装 Python 依赖

```bash
cd python_service
pip install -r requirements.txt
cd ..
```

#### 4. 配置环境变量

创建 `.env` 文件：

```bash
cp env.production.template .env
```

编辑 `.env` 文件，配置必要的环境变量：

```env
# 数据库配置
DATABASE_URL="file:./prisma/dev.db"

# JWT 密钥（必须修改！）
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# 应用 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Python 服务 URL
PYTHON_SERVICE_URL="http://localhost:8000"

# LLM 配置（可选）
LLM_API_URL="https://api.openai.com/v1/chat/completions"
LLM_API_KEY="your-openai-api-key"
LLM_MODEL="gpt-4o-mini"
```

#### 5. 初始化数据库

```bash
npx prisma generate
npx prisma db push
```

#### 6. 启动开发服务器

**终端 1 - 启动 Next.js 前端：**

```bash
npm run dev
```

**终端 2 - 启动 Python 后端：**

```bash
cd python_service
uvicorn main:app --reload --port 8000
```

#### 7. 访问应用

打开浏览器访问：`http://localhost:3000`

---

## 🚢 部署指南

### Docker Compose 部署（推荐）

这是最简单的部署方式，一条命令启动所有服务。

#### 1. 准备环境变量

```bash
cp env.production.template .env
# 编辑 .env 文件，修改必要的配置
```

#### 2. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 3. 初始化数据库

```bash
# 首次部署需要初始化数据库
docker-compose exec web npx prisma db push
```

#### 4. 访问应用

打开浏览器访问：`http://your-server-ip:3000`

### 详细部署指南

完整的部署文档请参考：

- **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** - 完整部署指南，包含所有细节
- **[DEPLOY_1PANEL.md](./DEPLOY_1PANEL.md)** - 1Panel 平台部署指南

### 环境变量说明

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `WEB_PORT` | Web 服务端口 | 3000 | 否 |
| `PYTHON_PORT` | Python 服务端口 | 8000 | 否 |
| `DATABASE_URL` | 数据库连接字符串 | file:/app/prisma/dev.db | 是 |
| `JWT_SECRET` | JWT 密钥 | - | **是** |
| `NEXT_PUBLIC_APP_URL` | 应用访问地址 | http://localhost:3000 | 是 |
| `PYTHON_SERVICE_URL` | Python 服务地址 | http://python-service:8000 | 是 |
| `LLM_API_URL` | LLM API 地址 | https://api.openai.com/v1/chat/completions | 否 |
| `LLM_API_KEY` | LLM API 密钥 | - | 否 |
| `LLM_MODEL` | LLM 模型名称 | gpt-4o-mini | 否 |
| `MAX_AGENT_ITERATIONS` | Agent 最大迭代次数 | 15 | 否 |

---

## 📖 功能详解

### 数据分析 Agent 使用指南

#### 1. 上传数据文件

- 支持格式：CSV、Excel (.xlsx/.xls)、JSON、TXT
- 最大文件大小：50MB
- 拖拽或点击上传

#### 2. 创建分析任务

- 选择已上传的文件
- 输入分析需求（自然语言）
  - 示例："分析销售数据的趋势，找出异常值"
  - 示例："对比不同地区的销售情况"
  - 示例："检查数据质量，生成统计报告"

#### 3. Agent 自动分析

Agent 会自动：
1. 加载数据
2. 检查数据质量
3. 进行统计分析
4. 检测异常值
5. 分析相关性
6. 生成洞察
7. 输出结论

#### 4. 查看结果

- 实时查看分析进度
- 查看 Agent 的思考过程
- 下载分析报告

### Excel 处理使用指南

#### 1. 上传 Excel 文件

文件格式要求：
- 数据格式：`x1, y1, (空列), x2, y2, ...`
- 每两列为一组数据
- B组和E组成对出现

#### 2. 配置处理参数

- B组斜率：默认 -0.4823
- E组斜率：默认 0.4557
- 可自定义修改

#### 3. 执行处理

系统会自动：
1. 识别数据组
2. 计算线性部分
3. 计算非线性部分
4. 生成结果 Excel

#### 4. 下载结果

结果文件包含：
- 每组数据的详细计算结果
- 计算参数和公式说明
- 汇总 Sheet

---

## 📡 API 文档

### 认证 API

#### POST `/api/auth/register`

注册新用户

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名"
}
```

#### POST `/api/auth/login`

用户登录

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 文件 API

#### POST `/api/files/upload`

上传文件

**请求：** `multipart/form-data`

#### GET `/api/files`

获取文件列表

#### DELETE `/api/files/[id]`

删除文件

### 任务 API

#### POST `/api/tasks/create`

创建分析任务

**请求体：**
```json
{
  "fileId": "...",
  "name": "任务名称",
  "description": "任务描述"
}
```

#### GET `/api/tasks/[id]`

获取任务详情

#### GET `/api/tasks/[id]/status`

获取任务状态

### Python 服务 API

#### POST `/analyze`

创建数据分析任务

**请求体：**
```json
{
  "task_id": "...",
  "file_path": "/path/to/file",
  "file_name": "data.csv",
  "user_query": "分析销售趋势",
  "callback_url": "http://..."
}
```

#### GET `/task/{task_id}`

获取任务状态

#### POST `/process-excel`

Excel 数据处理

#### POST `/generate-report`

生成分析报告

---

## 🔧 开发指南

### 添加新的分析工具

在 `python_service/main.py` 中添加新工具：

```python
class MyCustomTool(Tool):
    name = "my_tool"
    description = "工具描述"
    parameters = {
        "type": "object",
        "properties": {
            "param1": {"type": "string", "description": "参数说明"}
        },
        "required": ["param1"]
    }
    
    async def execute(self, param1: str, **kwargs) -> ToolResult:
        # 实现工具逻辑
        return ToolResult(True, "执行成功", data)
```

### 添加新的 API 路由

在 `src/app/api/` 下创建新路由：

```typescript
// src/app/api/my-route/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  
  // 处理逻辑
  return NextResponse.json({ data: '...' })
}
```

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 组件使用函数式组件和 Hooks
- 使用 async/await 处理异步操作

---

## ❓ 常见问题

### Q1: 如何修改 LLM API？

编辑 `.env` 文件：

```env
LLM_API_URL=https://your-llm-api.com/v1/chat/completions
LLM_API_KEY=your-api-key
LLM_MODEL=your-model-name
```

支持任何 OpenAI 兼容的 API。

### Q2: 如何增加文件上传大小限制？

编辑 `next.config.ts`：

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '100mb', // 修改为需要的大小
  },
}
```

### Q3: 如何备份数据？

重要数据位置：
- 数据库：`prisma/dev.db`
- 上传文件：`uploads/`

备份命令：
```bash
cp prisma/dev.db backup/dev_$(date +%Y%m%d).db
tar -czf backup/uploads_$(date +%Y%m%d).tar.gz uploads/
```

### Q4: Agent 分析失败怎么办？

1. 检查 LLM API 配置是否正确
2. 查看 Python 服务日志：`docker-compose logs python-service`
3. 确认数据文件格式正确
4. 检查 Agent 迭代次数限制

---

## 📝 更新日志

### v2.0.0 (当前版本)

#### 新增功能
- ✨ 完整的报告生成系统（Word/PPT）
- ✨ 图像编辑器 Pro（24个组件）
- ✨ OCR 文字识别功能
- ✨ PDF 导出功能
- ✨ AI 设计助手
- ✨ 图表生成器

#### 改进
- 🚀 优化 Agent 性能
- 🚀 改进 Excel 处理引擎
- 🎨 全新 UI 设计
- 📱 响应式布局优化

#### 修复
- 🐛 修复文件上传问题
- 🐛 修复数据库连接问题
- 🐛 修复认证 Token 过期问题

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License

Copyright (c) 2024 数据分析Agent团队

---

## 📞 联系方式

- **项目主页**: [GitHub Repository](#)
- **问题反馈**: [Issues](#)
- **文档**: [Wiki](#)

---

## 🙏 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/) - React 框架
- [FastAPI](https://fastapi.tiangolo.com/) - Python Web 框架
- [Prisma](https://www.prisma.io/) - 数据库 ORM
- [TailwindCSS](https://tailwindcss.com/) - CSS 框架
- [Fabric.js](http://fabricjs.com/) - 画布库
- [Pandas](https://pandas.pydata.org/) - 数据分析库
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR 引擎

以及所有贡献者和用户的支持！

---

<div align="center">

**Made with ❤️ by 数据分析Agent团队**

⭐ 如果这个项目对你有帮助，请给我们一个 Star！

</div>
