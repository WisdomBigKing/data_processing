# 数据分析 Agent 服务

这是一个真正的大模型 Agent 服务，采用 **ReAct (Reasoning + Acting)** 架构，能够自主规划分析步骤、调用工具与数据交互、并生成有价值的洞察。

## 架构特点

### 与传统数据分析服务的区别

| 特性     | 传统服务         | Agent 服务                |
| -------- | ---------------- | ------------------------- |
| 分析流程 | 固定流程，硬编码 | 自主规划，动态决策        |
| 工具使用 | 直接调用函数     | 通过 LLM 决定调用哪个工具 |
| 结果生成 | 模板化输出       | 基于分析结果智能总结      |
| 可扩展性 | 需要修改代码     | 添加新工具即可            |
| 用户交互 | 固定参数         | 支持自然语言需求          |

### Agent 核心组件

```
┌─────────────────────────────────────────────────────────┐
│                    DataAnalysisAgent                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Memory    │  │    Tools    │  │     LLM     │     │
│  │  (记忆系统)  │  │  (工具集合)  │  │  (大模型)   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│         │                │                │             │
│         └────────────────┼────────────────┘             │
│                          ▼                              │
│              ┌─────────────────────┐                   │
│              │   ReAct Loop        │                   │
│              │  思考→行动→观察→...  │                   │
│              └─────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### ReAct 执行循环

```
1. Thought (思考): Agent分析当前状态，决定下一步
2. Action (行动): 选择并调用合适的工具
3. Observation (观察): 获取工具执行结果
4. 重复直到任务完成或达到最大迭代次数
```

## 可用工具

| 工具名称               | 描述                             |
| ---------------------- | -------------------------------- |
| `load_data`            | 加载数据文件（CSV、Excel、JSON） |
| `data_overview`        | 获取数据基本概览                 |
| `data_quality_check`   | 全面检查数据质量                 |
| `describe_numeric`     | 数值列描述性统计                 |
| `describe_categorical` | 分类列统计分析                   |
| `correlation_analysis` | 变量相关性分析                   |
| `detect_outliers`      | 异常值检测                       |
| `group_analysis`       | 分组聚合分析                     |
| `generate_insight`     | 记录数据洞察                     |
| `final_answer`         | 输出最终分析报告                 |

## 接口规范

### 1. 提交分析任务

- **URL**: `POST /api/analyze`
- **请求体**:

```json
{
  "task_id": "任务ID",
  "file_path": "文件路径",
  "file_name": "原始文件名",
  "analysis_type": "分析类型",
  "callback_url": "回调URL",
  "user_query": "用户的自然语言分析需求（可选）",
  "options": {}
}
```

- **响应**:

```json
{
  "success": true,
  "message": "Agent任务已提交"
}
```

### 2. 查询任务状态

- **URL**: `GET /api/task/{task_id}/status`
- **响应**:

```json
{
  "status": "processing",
  "progress": 50,
  "result": null,
  "error": null
}
```

### 3. 取消任务

- **URL**: `POST /api/task/{task_id}/cancel`

### 4. 健康检查

- **URL**: `GET /health`
- **响应**:

```json
{
  "status": "ok",
  "version": "2.0.0",
  "agent_enabled": true,
  "llm_configured": true
}
```

## 回调结果格式

Agent 分析完成后，回调的结果包含：

```json
{
  "status": "completed",
  "progress": 100,
  "result": {
    "summary": "分析摘要",
    "key_findings": ["发现1", "发现2"],
    "recommendations": ["建议1", "建议2"],
    "data_info": {
      "totalRows": 1000,
      "columns": 10,
      "columnNames": ["col1", "col2"]
    },
    "agent_thoughts": [
      {
        "thought": "Agent的思考过程",
        "action": "调用的工具",
        "observation": "工具返回结果"
      }
    ],
    "insights": [],
    "iterations": 8
  },
  "reportName": "文件名 - Agent分析报告",
  "reportType": "json"
}
```

## 快速开始

### 1. 安装依赖

```bash
cd python_service
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
# LLM配置（支持OpenAI API兼容接口）
export LLM_API_URL="https://api.openai.com/v1/chat/completions"
export LLM_API_KEY="your-api-key"
export LLM_MODEL="gpt-4o-mini"

# Agent配置
export MAX_AGENT_ITERATIONS=15
```

### 3. 启动服务

```bash
python main.py
```

服务将在 http://localhost:8000 启动。

## 无 API Key 模式

如果未配置 `LLM_API_KEY`，Agent 将使用内置的模拟模式运行，按照预设的分析流程执行。这对于测试和演示非常有用。

## 扩展工具

要添加新的分析工具，只需：

1. 继承 `Tool` 基类
2. 实现 `execute` 方法
3. 在 `DataAnalysisAgent.__init__` 中注册工具

```python
class MyNewTool(Tool):
    name = "my_tool"
    description = "工具描述"
    parameters = {...}

    async def execute(self, **kwargs) -> ToolResult:
        # 实现工具逻辑
        return ToolResult(True, "输出", data)
```

## 前端环境变量配置

在前端项目的 `.env` 文件中配置：

```env
PYTHON_SERVICE_URL=http://localhost:8000
PYTHON_SERVICE_TIMEOUT=60000
PYTHON_CALLBACK_API_KEY=your-secret-key
```
