"""
================================================================================
                        数据分析 Agent 服务 (Data Analysis Agent Service)
================================================================================

【什么是Agent？】
Agent（智能体）是一种能够自主思考、决策和行动的AI程序。与传统程序不同，Agent不是
按照固定流程执行，而是根据目标自主规划步骤，就像一个真正的数据分析师一样工作。

【本服务采用的架构：ReAct (Reasoning + Acting)】
ReAct是一种经典的Agent架构，核心思想是：
1. Reasoning（推理）：Agent先思考当前情况，决定下一步该做什么
2. Acting（行动）：Agent调用工具执行具体操作
3. 观察结果后，继续思考下一步...如此循环，直到任务完成

【工作流程示意图】
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   用户请求 ──→ Agent思考 ──→ 选择工具 ──→ 执行工具 ──→ 观察结果 ──→ ...    │
│                   ↑                                         │               │
│                   └─────────────────────────────────────────┘               │
│                              (循环直到完成)                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

【核心组件】
1. 工具（Tools）：Agent可以调用的功能，如加载数据、统计分析、异常检测等
2. 记忆（Memory）：保存Agent的思考历史和中间结果
3. 大模型（LLM）：Agent的"大脑"，负责思考和决策
4. 执行循环：协调思考-行动-观察的迭代过程

【文件结构】
- 第1部分：导入依赖和配置
- 第2部分：数据模型定义
- 第3部分：工具类定义（10个分析工具）
- 第4部分：Agent核心类
- 第5部分：API路由（FastAPI接口）

作者：数据分析Agent团队
版本：2.0.0
"""

# ============================================================================
# 第1部分：导入依赖库
# ============================================================================

# asyncio: Python的异步编程库，让程序可以同时处理多个任务
import asyncio

# json: 用于处理JSON格式数据（一种通用的数据交换格式）
import json

# os: 操作系统接口，用于读取环境变量、文件路径等
import os

# ABC和abstractmethod: 用于定义抽象基类（一种设计模式，强制子类实现某些方法）
from abc import ABC, abstractmethod

# datetime: 处理日期和时间
from datetime import datetime

# typing: 类型提示，让代码更清晰，IDE也能提供更好的提示
# - Optional: 表示值可以是指定类型或None
# - Dict: 字典类型
# - Any: 任意类型
# - List: 列表类型
# - Callable: 可调用对象（函数）类型
from typing import Optional, Dict, Any, List, Callable

# Enum: 枚举类型，用于定义一组固定的常量
from enum import Enum

# dataclass: 数据类装饰器，自动生成__init__等方法，简化类的定义
# field: 用于自定义dataclass字段的默认值
from dataclasses import dataclass, field

# httpx: 现代化的HTTP客户端库，支持异步请求（用于调用LLM API和发送回调）
import httpx

# pandas: 强大的数据分析库，提供DataFrame数据结构（类似Excel表格）
import pandas as pd

# numpy: 数值计算库，提供高效的数组操作
import numpy as np

# FastAPI相关：
# - FastAPI: 现代化的Web框架，用于创建API接口
# - BackgroundTasks: 后台任务，让耗时操作在后台执行，不阻塞API响应
# - HTTPException: HTTP异常，用于返回错误响应
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse

# CORS中间件：用于处理跨域请求
from fastapi.middleware.cors import CORSMiddleware

# Pydantic的BaseModel: 用于定义数据模型，自动进行数据验证
from pydantic import BaseModel

# ============================================================================
# 创建FastAPI应用实例
# ============================================================================
# FastAPI是一个现代、快速的Web框架，用于构建API
# title: API的标题，会显示在自动生成的文档中
# version: API版本号
app = FastAPI(title="数据分析Agent服务", version="2.0.0")

# ============================================================================
# CORS配置（跨域资源共享）
# ============================================================================
# 允许前端（Next.js）从不同端口访问后端API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # 允许的前端地址
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有HTTP方法
    allow_headers=["*"],  # 允许所有请求头
)

# ============================================================================
# 第1.1部分：配置项
# ============================================================================
# 这些配置通过环境变量读取，方便在不同环境（开发、测试、生产）中使用不同的值
# os.getenv("变量名", "默认值") - 如果环境变量不存在，则使用默认值

# LLM（大语言模型）API的URL地址
# 默认使用OpenAI的API，但也可以配置为其他兼容的API（如本地部署的模型）
LLM_API_URL = os.getenv("LLM_API_URL", "https://api.openai.com/v1/chat/completions")

# LLM API的密钥（用于身份验证）
# 重要：生产环境中必须设置这个环境变量，不要在代码中硬编码密钥！
LLM_API_KEY = os.getenv("LLM_API_KEY", "")

# 使用的模型名称
# gpt-4o-mini是OpenAI的一个高效模型，也可以换成gpt-4、gpt-3.5-turbo等
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

# Agent最大迭代次数
# 防止Agent陷入无限循环，超过这个次数就强制停止
MAX_AGENT_ITERATIONS = int(os.getenv("MAX_AGENT_ITERATIONS", "15"))

# ============================================================================
# 任务状态存储
# ============================================================================
# 使用字典存储所有任务的状态
# 键：任务ID（字符串）
# 值：任务状态信息（字典）
# 注意：这是内存存储，服务重启后数据会丢失。生产环境建议使用Redis或数据库
tasks_store: Dict[str, Dict[str, Any]] = {}


# ============================================================================
# 第2部分：数据模型定义
# ============================================================================
# 数据模型用于定义数据的结构，确保数据的类型和格式正确
# 这就像是给数据定义一个"模板"，所有数据都必须符合这个模板

class TaskStatus(str, Enum):
    """
    任务状态枚举类
    
    【什么是枚举？】
    枚举是一种特殊的类，用于定义一组固定的常量值。
    使用枚举可以避免魔法字符串（直接写"pending"这样的字符串），让代码更清晰、更安全。
    
    【继承str的原因】
    继承str让枚举值可以直接当字符串使用，方便JSON序列化
    """
    PENDING = "pending"        # 等待中：任务已创建，等待处理
    PROCESSING = "processing"  # 处理中：Agent正在分析数据
    COMPLETED = "completed"    # 已完成：分析成功完成
    FAILED = "failed"          # 失败：分析过程中出错


class AnalyzeRequest(BaseModel):
    """
    分析请求的数据模型
    
    【什么是Pydantic BaseModel？】
    Pydantic是一个数据验证库，BaseModel是它的核心类。
    继承BaseModel后，类会自动：
    1. 验证数据类型（如果传入的数据类型不对，会报错）
    2. 自动转换兼容的类型（如字符串"123"转为整数123）
    3. 生成JSON Schema（用于API文档）
    
    【字段说明】
    每个字段的格式是：字段名: 类型 = 默认值
    没有默认值的字段是必填的
    """
    task_id: str                          # 任务的唯一标识符（必填）
    file_path: str                        # 要分析的文件在服务器上的路径（必填）
    file_name: str                        # 原始文件名，用于判断文件格式（必填）
    analysis_type: str = "default"        # 分析类型，默认为"default"
    callback_url: str                     # 回调URL，分析完成后通知前端（必填）
    options: Dict[str, Any] = {}          # 额外选项，默认为空字典
    user_query: str = ""                  # 用户的自然语言分析需求，如"帮我分析销售趋势"


class TaskStatusResponse(BaseModel):
    """
    任务状态响应的数据模型
    
    这个模型定义了查询任务状态时返回的数据结构
    """
    status: TaskStatus                           # 任务当前状态
    progress: int                                # 进度百分比（0-100）
    result: Optional[Dict[str, Any]] = None      # 分析结果，完成前为None
    error: Optional[str] = None                  # 错误信息，正常情况为None


# ============================================================================
# Agent核心数据结构
# ============================================================================

@dataclass
class ToolResult:
    """
    工具执行结果
    
    【什么是@dataclass？】
    @dataclass是Python 3.7引入的装饰器，用于简化类的定义。
    它会自动生成__init__、__repr__等方法，让我们不用写重复的代码。
    
    【示例】
    不用dataclass:
        class ToolResult:
            def __init__(self, success, output, data=None):
                self.success = success
                self.output = output
                self.data = data
    
    用dataclass:
        @dataclass
        class ToolResult:
            success: bool
            output: str
            data: Any = None
    
    效果完全一样，但代码更简洁！
    """
    success: bool      # 工具是否执行成功
    output: str        # 工具的文本输出（给Agent看的，用于下一步决策）
    data: Any = None   # 工具返回的数据（如DataFrame），默认为None


@dataclass
class AgentThought:
    """
    Agent的单次思考记录
    
    每次Agent思考并执行一个动作，都会产生一条AgentThought记录。
    这就像是Agent的"思考日志"，记录了它的推理过程。
    
    【ReAct模式的体现】
    - thought: 推理部分（Reasoning）- Agent在想什么
    - action: 行动部分（Acting）- Agent决定做什么
    - action_input: 行动的参数
    - observation: 观察结果 - 执行后看到了什么
    """
    thought: str                    # Agent的思考内容，如"数据已加载，接下来检查数据质量"
    action: str                     # 要执行的工具名称，如"data_quality_check"
    action_input: Dict[str, Any]    # 工具的输入参数，如{"columns": ["age", "salary"]}
    observation: str = ""           # 工具执行后的观察结果


@dataclass
class AgentMemory:
    """
    Agent的记忆系统
    
    【为什么需要记忆？】
    Agent需要记住之前做了什么，才能决定接下来做什么。
    就像人类分析师会记住"我已经看过数据概览了，接下来该做统计分析"。
    
    【记忆的内容】
    1. thoughts: 所有的思考记录（AgentThought列表）
    2. data_context: 数据相关的上下文信息
    3. intermediate_results: 中间分析结果
    
    【field(default_factory=list)的作用】
    在dataclass中，如果默认值是可变对象（如列表、字典），
    必须使用default_factory，否则所有实例会共享同一个对象！
    错误写法：thoughts: List[AgentThought] = []  # 所有实例共享这个列表！
    正确写法：thoughts: List[AgentThought] = field(default_factory=list)
    """
    thoughts: List[AgentThought] = field(default_factory=list)           # 思考历史
    data_context: Dict[str, Any] = field(default_factory=dict)           # 数据上下文
    intermediate_results: List[Dict[str, Any]] = field(default_factory=list)  # 中间结果
    
    def add_thought(self, thought: AgentThought):
        """
        添加一条思考记录
        
        参数:
            thought: AgentThought对象，包含思考、行动和观察
        """
        self.thoughts.append(thought)
    
    def get_history(self) -> str:
        """
        获取思考历史的文本表示
        
        这个方法将所有思考记录格式化为字符串，用于：
        1. 作为上下文传给LLM，让它知道之前做了什么
        2. 调试时查看Agent的推理过程
        
        返回:
            格式化的历史字符串，每条记录包含Thought、Action、Action Input、Observation
        """
        history = []
        for t in self.thoughts:
            history.append(f"Thought: {t.thought}")
            history.append(f"Action: {t.action}")
            history.append(f"Action Input: {json.dumps(t.action_input, ensure_ascii=False)}")
            if t.observation:
                history.append(f"Observation: {t.observation}")
        return "\n".join(history)


# ============================================================================
# 第3部分：工具定义
# ============================================================================
# 
# 【什么是工具（Tool）？】
# 工具是Agent可以调用的功能模块。Agent通过调用不同的工具来完成任务。
# 就像人类分析师使用Excel、Python、SQL等工具一样，Agent也需要工具来操作数据。
# 
# 【工具的设计模式】
# 我们使用"抽象基类"模式来定义工具：
# 1. 定义一个基类Tool，规定所有工具必须有的属性和方法
# 2. 每个具体工具继承Tool类，实现自己的逻辑
# 
# 【本服务提供的工具】
# 1. load_data: 加载数据文件
# 2. data_overview: 数据概览
# 3. describe_numeric: 数值列统计
# 4. describe_categorical: 分类列统计
# 5. correlation_analysis: 相关性分析
# 6. detect_outliers: 异常值检测
# 7. group_analysis: 分组分析
# 8. data_quality_check: 数据质量检查
# 9. generate_insight: 生成洞察
# 10. final_answer: 输出最终答案
# ============================================================================

class Tool(ABC):
    """
    工具的抽象基类
    
    【什么是抽象基类（ABC）？】
    抽象基类是一种特殊的类，它：
    1. 不能被直接实例化（不能直接创建Tool对象）
    2. 定义了子类必须实现的方法（用@abstractmethod标记）
    3. 确保所有工具都有统一的接口
    
    【为什么要用抽象基类？】
    想象一下，如果每个工具的接口都不一样，Agent就很难统一调用它们。
    通过抽象基类，我们保证：
    - 每个工具都有name、description、parameters属性
    - 每个工具都有execute方法
    - Agent可以用相同的方式调用任何工具
    
    【类属性说明】
    - name: 工具名称，Agent通过这个名称来调用工具
    - description: 工具描述，告诉Agent这个工具能做什么
    - parameters: 工具参数的JSON Schema，定义了工具需要什么输入
    """
    name: str                      # 工具名称
    description: str               # 工具描述
    parameters: Dict[str, Any]     # 参数定义（JSON Schema格式）
    
    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """
        执行工具的抽象方法
        
        【什么是@abstractmethod？】
        这个装饰器表示这是一个"抽象方法"，子类必须实现它。
        如果子类没有实现这个方法，Python会报错。
        
        【为什么是async？】
        async表示这是一个异步方法，可以在等待IO操作时不阻塞程序。
        比如读取大文件时，程序可以同时处理其他任务。
        
        参数:
            **kwargs: 关键字参数，具体参数由各工具自己定义
            
        返回:
            ToolResult: 包含执行结果的对象
        """
        pass
    
    def get_schema(self) -> Dict[str, Any]:
        """
        获取工具的完整Schema
        
        返回一个字典，包含工具的名称、描述和参数定义。
        这个Schema会被传给LLM，让它知道如何调用这个工具。
        """
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters
        }


# ============================================================================
# 工具1：加载数据工具
# ============================================================================

class LoadDataTool(Tool):
    """
    加载数据文件的工具
    
    【功能】
    将CSV、Excel、JSON等格式的文件加载到内存中，转换为pandas DataFrame。
    这通常是数据分析的第一步。
    
    【支持的文件格式】
    - .csv: 逗号分隔值文件
    - .xlsx/.xls: Excel文件
    - .json: JSON格式文件
    - .txt: 制表符分隔的文本文件
    
    【输入参数】
    - file_path: 文件的完整路径
    - file_name: 文件名（用于判断文件格式）
    
    【输出】
    - 成功：返回数据的基本信息（行数、列数、列名、数据类型）
    - 失败：返回错误信息
    """
    
    # 工具名称 - Agent通过这个名称来调用工具
    name = "load_data"
    
    # 工具描述 - 告诉Agent这个工具的用途
    description = "加载数据文件到内存中，支持CSV、Excel、JSON格式。这是分析的第一步。"
    
    # 参数定义 - 使用JSON Schema格式
    # JSON Schema是一种描述JSON数据结构的标准格式
    parameters = {
        "type": "object",                    # 参数是一个对象（字典）
        "properties": {                      # 对象的属性定义
            "file_path": {
                "type": "string",            # 字符串类型
                "description": "文件路径"    # 参数描述
            },
            "file_name": {
                "type": "string",
                "description": "文件名（用于判断格式）"
            }
        },
        "required": ["file_path", "file_name"]  # 必填参数列表
    }
    
    async def execute(self, file_path: str, file_name: str, **kwargs) -> ToolResult:
        """
        执行数据加载
        
        参数:
            file_path: 文件的完整路径
            file_name: 原始文件名
            **kwargs: 其他参数（本工具不使用，但为了接口统一需要接收）
            
        返回:
            ToolResult: 包含加载结果的对象
                - success=True时，data字段包含DataFrame
                - success=False时，output字段包含错误信息
        """
        try:
            # 从文件名中提取扩展名，并转为小写
            # os.path.splitext("data.csv") 返回 ("data", ".csv")
            file_ext = os.path.splitext(file_name)[1].lower()
            
            # 根据文件扩展名选择不同的读取方法
            if file_ext == '.csv':
                # pandas的read_csv函数读取CSV文件
                df = pd.read_csv(file_path)
            elif file_ext in ['.xlsx', '.xls']:
                # pandas的read_excel函数读取Excel文件
                # 需要安装openpyxl库
                df = pd.read_excel(file_path)
            elif file_ext == '.json':
                # pandas的read_json函数读取JSON文件
                df = pd.read_json(file_path)
            elif file_ext == '.txt':
                # 尝试以制表符分隔的格式读取txt文件
                df = pd.read_csv(file_path, sep='\t')
            else:
                # 不支持的文件格式，返回失败
                return ToolResult(False, f"不支持的文件格式: {file_ext}")
            
            # 构建成功信息
            # len(df): DataFrame的行数
            # len(df.columns): DataFrame的列数
            # df.columns.tolist(): 列名列表
            # df.dtypes: 每列的数据类型
            info = f"成功加载数据：{len(df)} 行 x {len(df.columns)} 列\n"
            info += f"列名: {', '.join(df.columns.tolist())}\n"
            info += f"数据类型:\n{df.dtypes.to_string()}"
            
            # 返回成功结果，data字段包含DataFrame供后续工具使用
            return ToolResult(True, info, df)
            
        except Exception as e:
            # 捕获所有异常，返回失败结果
            # str(e): 将异常转换为字符串，获取错误信息
            return ToolResult(False, f"加载数据失败: {str(e)}")


# ============================================================================
# 工具2：数据概览工具
# ============================================================================

class DataOverviewTool(Tool):
    """
    数据概览工具
    
    【功能】
    快速了解数据的基本情况，包括：
    - 数据形状（行数和列数）
    - 列名和数据类型
    - 缺失值统计
    - 内存占用
    
    【使用场景】
    通常在加载数据后第一个调用，帮助Agent了解数据的整体情况，
    从而决定后续的分析策略。
    
    【输入参数】
    无需参数，直接使用已加载的DataFrame
    
    【输出】
    数据的基本统计信息
    """
    name = "data_overview"
    description = "获取数据的基本概览，包括形状、数据类型、缺失值统计等。"
    
    # 这个工具不需要额外参数，所以properties为空
    parameters = {
        "type": "object",
        "properties": {},
        "required": []
    }
    
    async def execute(self, df: pd.DataFrame = None, **kwargs) -> ToolResult:
        """
        执行数据概览分析
        
        参数:
            df: pandas DataFrame，由Agent自动注入（来自load_data的结果）
            **kwargs: 其他参数
            
        返回:
            ToolResult: 包含数据概览信息
        """
        # 检查是否已加载数据
        if df is None:
            return ToolResult(False, "请先使用load_data加载数据")
        
        try:
            # 构建概览信息字典
            overview = {
                # 数据形状
                "shape": {"rows": len(df), "columns": len(df.columns)},
                # 所有列名
                "columns": df.columns.tolist(),
                # 每列的数据类型（转为字符串以便JSON序列化）
                "dtypes": df.dtypes.astype(str).to_dict(),
                # 每列的缺失值数量
                # df.isnull(): 返回布尔DataFrame，True表示缺失
                # .sum(): 对每列求和，得到缺失值数量
                "missing_values": df.isnull().sum().to_dict(),
                # 每列的缺失值百分比
                "missing_percentage": (df.isnull().sum() / len(df) * 100).round(2).to_dict(),
                # 内存占用（转换为MB）
                # deep=True: 计算对象类型的实际内存占用
                "memory_usage": f"{df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB"
            }
            
            # 构建人类可读的输出文本
            output = f"""数据概览:
- 形状: {overview['shape']['rows']} 行 x {overview['shape']['columns']} 列
- 内存占用: {overview['memory_usage']}
- 缺失值: {sum(1 for v in overview['missing_values'].values() if v > 0)} 列存在缺失值
"""
            return ToolResult(True, output, overview)
        except Exception as e:
            return ToolResult(False, f"获取数据概览失败: {str(e)}")


# ============================================================================
# 工具3：数值列统计工具
# ============================================================================

class DescribeNumericTool(Tool):
    """
    数值列描述性统计工具
    
    【功能】
    对数值类型的列进行统计分析，计算：
    - count: 非空值数量
    - mean: 平均值
    - std: 标准差（衡量数据的离散程度）
    - min: 最小值
    - 25%: 第一四分位数（25%的数据小于此值）
    - 50%: 中位数（50%的数据小于此值）
    - 75%: 第三四分位数（75%的数据小于此值）
    - max: 最大值
    
    【什么是数值列？】
    数值列是指包含数字的列，如年龄、价格、数量等。
    pandas会自动识别int64、float64等数值类型。
    
    【输入参数】
    - columns: 可选，指定要分析的列名列表。如果不指定，分析所有数值列。
    """
    name = "describe_numeric"
    description = "对数值列进行描述性统计分析，包括均值、标准差、分位数等。"
    parameters = {
        "type": "object",
        "properties": {
            "columns": {
                "type": "array",              # 数组类型
                "items": {"type": "string"},  # 数组元素是字符串
                "description": "要分析的列名列表，为空则分析所有数值列"
            }
        },
        "required": []  # 没有必填参数
    }
    
    async def execute(self, df: pd.DataFrame = None, columns: List[str] = None, **kwargs) -> ToolResult:
        """
        执行数值列统计分析
        
        参数:
            df: pandas DataFrame
            columns: 要分析的列名列表，None表示分析所有数值列
        """
        if df is None:
            return ToolResult(False, "请先使用load_data加载数据")
        
        try:
            # select_dtypes: 选择特定数据类型的列
            # include=[np.number]: 选择所有数值类型（int、float等）
            numeric_df = df.select_dtypes(include=[np.number])
            
            # 如果指定了列名，只保留这些列
            if columns:
                # 列表推导式：只保留存在于numeric_df中的列
                numeric_df = numeric_df[[c for c in columns if c in numeric_df.columns]]
            
            # 检查是否有数值列
            if numeric_df.empty:
                return ToolResult(False, "没有找到数值列")
            
            # describe(): pandas的描述性统计函数
            # 自动计算count、mean、std、min、25%、50%、75%、max
            # round(4): 保留4位小数
            # to_dict(): 转换为字典格式
            stats = numeric_df.describe().round(4).to_dict()
            
            # 构建输出文本
            output = f"数值列统计分析 ({len(numeric_df.columns)} 列):\n"
            output += numeric_df.describe().round(2).to_string()
            
            return ToolResult(True, output, stats)
        except Exception as e:
            return ToolResult(False, f"数值统计失败: {str(e)}")


# ============================================================================
# 工具4：分类列统计工具
# ============================================================================

class DescribeCategoricalTool(Tool):
    """
    分类列统计工具
    
    【功能】
    对分类（文本）类型的列进行统计分析，包括：
    - 唯一值数量（有多少种不同的值）
    - 频率分布（每个值出现了多少次）
    - 缺失值数量
    
    【什么是分类列？】
    分类列是指包含文本或类别的列，如性别、城市、产品类型等。
    pandas中类型为object或category的列被视为分类列。
    
    【输入参数】
    - columns: 可选，指定要分析的列名列表
    - top_n: 显示出现频率最高的前N个值，默认10
    
    【使用场景】
    - 了解数据中有哪些类别
    - 发现数据分布是否均衡
    - 检测异常类别值
    """
    name = "describe_categorical"
    description = "对分类列进行统计分析，包括唯一值数量、频率分布等。"
    parameters = {
        "type": "object",
        "properties": {
            "columns": {
                "type": "array",
                "items": {"type": "string"},
                "description": "要分析的列名列表，为空则分析所有分类列"
            },
            "top_n": {
                "type": "integer",
                "description": "显示前N个最频繁的值",
                "default": 10
            }
        },
        "required": []
    }
    
    async def execute(self, df: pd.DataFrame = None, columns: List[str] = None, top_n: int = 10, **kwargs) -> ToolResult:
        """
        执行分类列统计分析
        
        参数:
            df: pandas DataFrame
            columns: 要分析的列名列表
            top_n: 显示前N个最频繁的值
        """
        if df is None:
            return ToolResult(False, "请先使用load_data加载数据")
        
        try:
            # 选择分类类型的列
            # 'object': 字符串类型
            # 'category': pandas的分类类型
            cat_df = df.select_dtypes(include=['object', 'category'])
            
            if columns:
                cat_df = cat_df[[c for c in columns if c in cat_df.columns]]
            
            if cat_df.empty:
                return ToolResult(False, "没有找到分类列")
            
            stats = {}
            output_parts = [f"分类列统计分析 ({len(cat_df.columns)} 列):"]
            
            # 遍历每个分类列
            for col in cat_df.columns:
                # value_counts(): 统计每个值出现的次数，按频率降序排列
                # head(top_n): 只取前N个
                value_counts = df[col].value_counts().head(top_n)
                
                stats[col] = {
                    # nunique(): 唯一值数量
                    "unique_count": df[col].nunique(),
                    # 频率最高的值及其出现次数
                    "top_values": value_counts.to_dict(),
                    # 缺失值数量
                    "null_count": df[col].isnull().sum()
                }
                
                # 构建输出文本
                output_parts.append(f"\n【{col}】唯一值: {stats[col]['unique_count']}")
                output_parts.append(f"  Top {min(top_n, len(value_counts))} 值: {dict(list(value_counts.items())[:5])}")
            
            return ToolResult(True, "\n".join(output_parts), stats)
        except Exception as e:
            return ToolResult(False, f"分类统计失败: {str(e)}")


# ============================================================================
# 工具5：相关性分析工具
# ============================================================================

class CorrelationAnalysisTool(Tool):
    """
    相关性分析工具
    
    【功能】
    计算数值列之间的相关系数，发现变量之间的关联关系。
    
    【什么是相关系数？】
    相关系数衡量两个变量之间的线性关系强度，取值范围是 -1 到 1：
    - 1: 完全正相关（一个变量增加，另一个也增加）
    - 0: 无相关性
    - -1: 完全负相关（一个变量增加，另一个减少）
    
    【相关系数的解读】
    - |r| >= 0.8: 强相关
    - 0.5 <= |r| < 0.8: 中等相关
    - 0.3 <= |r| < 0.5: 弱相关
    - |r| < 0.3: 几乎无相关
    
    【三种计算方法】
    - pearson: 皮尔逊相关系数，适用于线性关系，最常用
    - spearman: 斯皮尔曼相关系数，适用于非线性单调关系
    - kendall: 肯德尔相关系数，适用于小样本或有序数据
    
    【输入参数】
    - method: 计算方法，默认pearson
    - threshold: 只显示相关系数绝对值大于此阈值的结果，默认0.5
    
    【使用场景】
    - 发现哪些变量之间有关联
    - 特征选择（去除高度相关的冗余特征）
    - 探索性数据分析
    """
    name = "correlation_analysis"
    description = "计算数值列之间的相关系数矩阵，发现变量间的关联关系。"
    parameters = {
        "type": "object",
        "properties": {
            "method": {
                "type": "string",
                "enum": ["pearson", "spearman", "kendall"],  # 只能是这三个值之一
                "description": "相关系数计算方法",
                "default": "pearson"
            },
            "threshold": {
                "type": "number",
                "description": "只显示相关系数绝对值大于此阈值的结果",
                "default": 0.5
            }
        },
        "required": []
    }
    
    async def execute(self, df: pd.DataFrame = None, method: str = "pearson", threshold: float = 0.5, **kwargs) -> ToolResult:
        """
        执行相关性分析
        
        参数:
            df: pandas DataFrame
            method: 相关系数计算方法
            threshold: 相关系数阈值
        """
        if df is None:
            return ToolResult(False, "请先使用load_data加载数据")
        
        try:
            # 只选择数值列
            numeric_df = df.select_dtypes(include=[np.number])
            
            # 至少需要2列才能计算相关性
            if len(numeric_df.columns) < 2:
                return ToolResult(False, "需要至少2个数值列才能进行相关性分析")
            
            # corr(): 计算相关系数矩阵
            # 返回一个DataFrame，行和列都是变量名，值是相关系数
            corr_matrix = numeric_df.corr(method=method)
            
            # 找出高相关性的变量对
            # 遍历矩阵的上三角部分（避免重复）
            high_corr = []
            for i in range(len(corr_matrix.columns)):
                for j in range(i + 1, len(corr_matrix.columns)):  # j > i，只看上三角
                    corr_val = corr_matrix.iloc[i, j]
                    # 只保留相关系数绝对值大于阈值的
                    if abs(corr_val) >= threshold:
                        high_corr.append({
                            "var1": corr_matrix.columns[i],
                            "var2": corr_matrix.columns[j],
                            "correlation": round(corr_val, 4)
                        })
            
            # 按相关系数绝对值降序排序
            high_corr.sort(key=lambda x: abs(x["correlation"]), reverse=True)
            
            # 构建输出文本
            output = f"相关性分析 (方法: {method}, 阈值: {threshold}):\n"
            if high_corr:
                output += "高相关性变量对:\n"
                for item in high_corr[:10]:  # 只显示前10对
                    output += f"  {item['var1']} <-> {item['var2']}: {item['correlation']}\n"
            else:
                output += f"未发现相关系数绝对值大于 {threshold} 的变量对\n"
            
            return ToolResult(True, output, {
                "correlation_matrix": corr_matrix.round(4).to_dict(),
                "high_correlations": high_corr
            })
        except Exception as e:
            return ToolResult(False, f"相关性分析失败: {str(e)}")


# ============================================================================
# 工具6：异常值检测工具
# ============================================================================

class OutlierDetectionTool(Tool):
    """
    异常值检测工具
    
    【功能】
    使用IQR（四分位距）方法检测数值列中的异常值。
    
    【什么是异常值？】
    异常值是指明显偏离其他数据点的值，可能是：
    - 数据录入错误
    - 测量误差
    - 真实的极端情况
    
    【IQR方法原理】
    IQR = Q3 - Q1（第三四分位数 - 第一四分位数）
    
    异常值定义为：
    - 小于 Q1 - 1.5 * IQR 的值
    - 大于 Q3 + 1.5 * IQR 的值
    
    【图示说明】
    ←──────────────────────────────────────────────────────→
         异常值    |  正常范围  |    异常值
    ←─────────────|──────────|─────────────→
                  Q1-1.5*IQR  Q3+1.5*IQR
    
    【输入参数】
    - columns: 可选，指定要检测的列名列表
    - iqr_multiplier: IQR乘数，默认1.5。增大此值会减少检测到的异常值
    
    【使用场景】
    - 数据清洗前的质量检查
    - 发现数据中的异常情况
    - 决定是否需要处理异常值
    """
    name = "detect_outliers"
    description = "使用IQR方法检测数值列中的异常值。"
    parameters = {
        "type": "object",
        "properties": {
            "columns": {
                "type": "array",
                "items": {"type": "string"},
                "description": "要检测的列名列表，为空则检测所有数值列"
            },
            "iqr_multiplier": {
                "type": "number",
                "description": "IQR乘数，默认1.5",
                "default": 1.5
            }
        },
        "required": []
    }
    
    async def execute(self, df: pd.DataFrame = None, columns: List[str] = None, iqr_multiplier: float = 1.5, **kwargs) -> ToolResult:
        """
        执行异常值检测
        
        参数:
            df: pandas DataFrame
            columns: 要检测的列名列表
            iqr_multiplier: IQR乘数，用于调整异常值判定的严格程度
        """
        if df is None:
            return ToolResult(False, "请先使用load_data加载数据")
        
        try:
            # 只选择数值列
            numeric_df = df.select_dtypes(include=[np.number])
            if columns:
                numeric_df = numeric_df[[c for c in columns if c in numeric_df.columns]]
            
            if numeric_df.empty:
                return ToolResult(False, "没有找到数值列")
            
            outliers_info = {}
            output_parts = ["异常值检测结果:"]
            
            # 遍历每个数值列
            for col in numeric_df.columns:
                # quantile(0.25): 计算第一四分位数（25%分位数）
                Q1 = df[col].quantile(0.25)
                # quantile(0.75): 计算第三四分位数（75%分位数）
                Q3 = df[col].quantile(0.75)
                # IQR: 四分位距
                IQR = Q3 - Q1
                
                # 计算异常值的边界
                lower_bound = Q1 - iqr_multiplier * IQR  # 下边界
                upper_bound = Q3 + iqr_multiplier * IQR  # 上边界
                
                # 创建布尔掩码，标记异常值
                # | 是"或"运算符
                outlier_mask = (df[col] < lower_bound) | (df[col] > upper_bound)
                # sum(): True被当作1，False被当作0，所以sum()就是异常值数量
                outlier_count = outlier_mask.sum()
                
                # 如果有异常值，记录信息
                if outlier_count > 0:
                    outliers_info[col] = {
                        "count": int(outlier_count),
                        "percentage": round(outlier_count / len(df) * 100, 2),
                        "lower_bound": round(lower_bound, 4),
                        "upper_bound": round(upper_bound, 4)
                    }
                    output_parts.append(f"  【{col}】{outlier_count} 个异常值 ({outliers_info[col]['percentage']}%)")
            
            # 如果没有检测到任何异常值
            if not outliers_info:
                output_parts.append("  未检测到异常值")
            
            return ToolResult(True, "\n".join(output_parts), outliers_info)
        except Exception as e:
            return ToolResult(False, f"异常值检测失败: {str(e)}")


# ============================================================================
# 工具7：分组分析工具
# ============================================================================

class GroupAnalysisTool(Tool):
    """
    分组分析工具
    
    【功能】
    按指定列分组，计算其他列的聚合统计（类似SQL的GROUP BY）。
    
    【什么是分组分析？】
    分组分析是将数据按某个维度划分，然后对每组数据进行统计。
    例如：按城市分组，计算每个城市的平均销售额。
    
    【SQL等价操作】
    SELECT city, AVG(sales), COUNT(*) 
    FROM data 
    GROUP BY city
    
    【常用聚合函数】
    - mean: 平均值
    - sum: 求和
    - count: 计数
    - min: 最小值
    - max: 最大值
    - std: 标准差
    - median: 中位数
    
    【输入参数】
    - group_by: 必填，分组依据的列名
    - agg_columns: 可选，要聚合的列名列表
    - agg_functions: 可选，聚合函数列表，默认['mean', 'count']
    
    【使用场景】
    - 按类别统计数据
    - 对比不同组之间的差异
    - 发现数据中的模式
    """
    name = "group_analysis"
    description = "按指定列分组，计算其他列的聚合统计。"
    parameters = {
        "type": "object",
        "properties": {
            "group_by": {
                "type": "string",
                "description": "分组依据的列名"
            },
            "agg_columns": {
                "type": "array",
                "items": {"type": "string"},
                "description": "要聚合的列名列表"
            },
            "agg_functions": {
                "type": "array",
                "items": {"type": "string"},
                "description": "聚合函数列表，如['mean', 'sum', 'count']",
                "default": ["mean", "count"]
            }
        },
        "required": ["group_by"]  # group_by是必填参数
    }
    
    async def execute(self, df: pd.DataFrame = None, group_by: str = None, 
                     agg_columns: List[str] = None, agg_functions: List[str] = None, **kwargs) -> ToolResult:
        """
        执行分组分析
        
        参数:
            df: pandas DataFrame
            group_by: 分组依据的列名
            agg_columns: 要聚合的列名列表
            agg_functions: 聚合函数列表
        """
        if df is None:
            return ToolResult(False, "请先使用load_data加载数据")
        
        # 验证分组列是否存在
        if not group_by or group_by not in df.columns:
            return ToolResult(False, f"无效的分组列: {group_by}")
        
        try:
            # 如果没有指定聚合函数，使用默认值
            agg_functions = agg_functions or ["mean", "count"]
            
            # 如果指定了聚合列，只保留这些列
            if agg_columns:
                agg_df = df[[group_by] + [c for c in agg_columns if c in df.columns]]
            else:
                agg_df = df
            
            # 获取数值列（只有数值列才能做mean、sum等聚合）
            numeric_cols = agg_df.select_dtypes(include=[np.number]).columns.tolist()
            # 分组列不应该被聚合
            if group_by in numeric_cols:
                numeric_cols.remove(group_by)
            
            if not numeric_cols:
                # 如果没有数值列，只做计数
                # size(): 返回每组的行数
                # reset_index(): 将分组列从索引变回普通列
                result = df.groupby(group_by).size().reset_index(name='count')
            else:
                # groupby(): 按指定列分组
                # agg(): 对每组应用聚合函数
                result = df.groupby(group_by)[numeric_cols].agg(agg_functions).round(4)
            
            # 构建输出文本
            output = f"分组分析 (按 {group_by} 分组):\n"
            output += result.head(20).to_string()  # 只显示前20行
            
            return ToolResult(True, output, {
                "group_by": group_by,
                "result": result.head(50).to_dict() if hasattr(result, 'to_dict') else str(result)
            })
        except Exception as e:
            return ToolResult(False, f"分组分析失败: {str(e)}")


# ============================================================================
# 工具8：数据质量检查工具
# ============================================================================

class DataQualityCheckTool(Tool):
    """
    数据质量检查工具
    
    【功能】
    全面检查数据质量，发现潜在问题，包括：
    - 缺失值：哪些列有空值，缺失比例是多少
    - 重复值：是否有完全重复的行
    - 常量列：只有一个唯一值的列（可能没有分析价值）
    - 高基数列：唯一值过多的分类列（可能是ID列）
    
    【为什么数据质量很重要？】
    "垃圾进，垃圾出"（Garbage In, Garbage Out）
    如果数据质量差，分析结果也不可靠。在正式分析前，
    必须先了解数据质量，决定是否需要清洗。
    
    【常见数据质量问题】
    1. 缺失值：可能需要填充或删除
    2. 重复数据：可能需要去重
    3. 异常值：可能是错误数据
    4. 数据类型错误：如数字被存为文本
    5. 不一致的格式：如日期格式不统一
    
    【输入参数】
    无需参数，直接检查已加载的数据
    """
    name = "data_quality_check"
    description = "全面检查数据质量，包括缺失值、重复值、数据类型一致性等。"
    parameters = {
        "type": "object",
        "properties": {},
        "required": []
    }
    
    async def execute(self, df: pd.DataFrame = None, **kwargs) -> ToolResult:
        """
        执行数据质量检查
        
        参数:
            df: pandas DataFrame
        """
        if df is None:
            return ToolResult(False, "请先使用load_data加载数据")
        
        try:
            # 构建质量报告字典
            quality_report = {
                "total_rows": len(df),                    # 总行数
                "total_columns": len(df.columns),         # 总列数
                # duplicated(): 返回布尔Series，标记重复行
                "duplicate_rows": int(df.duplicated().sum()),
                "duplicate_percentage": round(df.duplicated().sum() / len(df) * 100, 2),
                # isnull().sum().sum(): 先对每列求缺失值数量，再求总和
                "missing_cells": int(df.isnull().sum().sum()),
                "missing_percentage": round(df.isnull().sum().sum() / (len(df) * len(df.columns)) * 100, 2),
                "columns_with_missing": {},   # 存在缺失值的列
                "constant_columns": [],       # 常量列（只有一个值）
                "high_cardinality_columns": [] # 高基数列（唯一值太多）
            }
            
            # 检查每列缺失值
            for col in df.columns:
                missing = df[col].isnull().sum()
                if missing > 0:
                    quality_report["columns_with_missing"][col] = {
                        "count": int(missing),
                        "percentage": round(missing / len(df) * 100, 2)
                    }
            
            # 检查常量列（只有一个唯一值的列）
            # 这种列通常没有分析价值，可以考虑删除
            for col in df.columns:
                if df[col].nunique() == 1:
                    quality_report["constant_columns"].append(col)
            
            # 检查高基数列
            # 如果一个分类列的唯一值数量超过行数的90%，可能是ID列
            for col in df.select_dtypes(include=['object']).columns:
                if df[col].nunique() > len(df) * 0.9:
                    quality_report["high_cardinality_columns"].append(col)
            
            # 构建人类可读的输出
            output = f"""数据质量报告:
- 总行数: {quality_report['total_rows']}
- 总列数: {quality_report['total_columns']}
- 重复行: {quality_report['duplicate_rows']} ({quality_report['duplicate_percentage']}%)
- 缺失单元格: {quality_report['missing_cells']} ({quality_report['missing_percentage']}%)
- 存在缺失值的列: {len(quality_report['columns_with_missing'])} 列
- 常量列: {len(quality_report['constant_columns'])} 列
- 高基数列: {len(quality_report['high_cardinality_columns'])} 列
"""
            return ToolResult(True, output, quality_report)
        except Exception as e:
            return ToolResult(False, f"数据质量检查失败: {str(e)}")


# ============================================================================
# 工具9：生成洞察工具
# ============================================================================

class GenerateInsightTool(Tool):
    """
    生成洞察工具
    
    【功能】
    在分析过程中，记录Agent发现的重要洞察。
    这些洞察会被收集起来，最终呈现在分析报告中。
    
    【什么是数据洞察？】
    洞察是从数据中发现的有价值的信息，例如：
    - "销售额与广告投入呈强正相关（r=0.85）"
    - "北京地区的客户平均消费是其他地区的2倍"
    - "数据中存在15%的缺失值，需要处理"
    
    【洞察类别】
    - 数据质量：关于数据本身质量的发现
    - 统计特征：关于数据分布、集中趋势的发现
    - 关联关系：关于变量之间关系的发现
    - 异常发现：关于异常值、异常模式的发现
    - 业务建议：基于分析结果的建议
    
    【输入参数】
    - insight: 必填，洞察内容
    - category: 必填，洞察类别
    - importance: 可选，重要程度（high/medium/low）
    """
    name = "generate_insight"
    description = "基于已有的分析结果，记录一条数据洞察或发现。"
    parameters = {
        "type": "object",
        "properties": {
            "insight": {
                "type": "string",
                "description": "洞察内容"
            },
            "category": {
                "type": "string",
                "enum": ["数据质量", "统计特征", "关联关系", "异常发现", "业务建议"],
                "description": "洞察类别"
            },
            "importance": {
                "type": "string",
                "enum": ["high", "medium", "low"],
                "description": "重要程度"
            }
        },
        "required": ["insight", "category"]
    }
    
    async def execute(self, insight: str, category: str, importance: str = "medium", **kwargs) -> ToolResult:
        """
        记录一条洞察
        
        参数:
            insight: 洞察内容
            category: 洞察类别
            importance: 重要程度
        """
        # 构建洞察记录
        insight_record = {
            "content": insight,
            "category": category,
            "importance": importance,
            "timestamp": datetime.now().isoformat()  # 记录时间戳
        }
        return ToolResult(True, f"已记录洞察: [{category}] {insight}", insight_record)


# ============================================================================
# 工具10：最终答案工具
# ============================================================================

class FinalAnswerTool(Tool):
    """
    最终答案工具
    
    【功能】
    当Agent完成所有分析后，使用此工具输出最终的分析报告。
    调用此工具意味着分析任务结束。
    
    【这是一个特殊的工具】
    与其他工具不同，这个工具的作用是"结束分析"。
    当Agent调用这个工具时，执行循环会停止，并返回最终结果。
    
    【输出内容】
    - summary: 分析摘要，概括整个分析的主要结论
    - key_findings: 关键发现列表，列出最重要的发现
    - recommendations: 建议列表，基于分析结果给出的建议
    
    【输入参数】
    - summary: 必填，分析摘要
    - key_findings: 必填，关键发现列表
    - recommendations: 可选，建议列表
    """
    name = "final_answer"
    description = "当分析完成时，使用此工具输出最终的分析报告和结论。"
    parameters = {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "分析摘要"
            },
            "key_findings": {
                "type": "array",
                "items": {"type": "string"},
                "description": "关键发现列表"
            },
            "recommendations": {
                "type": "array",
                "items": {"type": "string"},
                "description": "建议列表"
            }
        },
        "required": ["summary", "key_findings"]
    }
    
    async def execute(self, summary: str, key_findings: List[str], 
                     recommendations: List[str] = None, **kwargs) -> ToolResult:
        """
        生成最终报告
        
        参数:
            summary: 分析摘要
            key_findings: 关键发现列表
            recommendations: 建议列表
        """
        final_report = {
            "summary": summary,
            "key_findings": key_findings,
            "recommendations": recommendations or [],  # 如果没有建议，使用空列表
            "generated_at": datetime.now().isoformat()
        }
        return ToolResult(True, "分析完成", final_report)


# ============================================================================
# 第4部分：Agent 核心类
# ============================================================================
# 
# 这是整个服务最核心的部分！
# DataAnalysisAgent类实现了完整的ReAct循环，是Agent的"大脑"。
# 
# 【Agent的工作原理】
# 1. 接收用户的分析请求
# 2. 构建提示词，告诉LLM它是一个数据分析Agent，有哪些工具可用
# 3. 进入ReAct循环：
#    a. 调用LLM，获取思考和行动决策
#    b. 解析LLM的响应，提取要调用的工具和参数
#    c. 执行工具，获取结果
#    d. 将结果反馈给LLM，继续下一轮思考
# 4. 当LLM调用final_answer工具时，循环结束
# 5. 返回最终的分析报告
# ============================================================================

class DataAnalysisAgent:
    """
    数据分析Agent - 核心类
    
    【这个类做什么？】
    这是Agent的主体，负责：
    1. 管理工具集合
    2. 与LLM交互
    3. 执行ReAct循环
    4. 维护记忆系统
    5. 生成最终报告
    
    【关键属性】
    - task_id: 任务ID，用于跟踪任务状态
    - callback_url: 回调URL，用于通知前端进度
    - memory: 记忆系统，保存思考历史
    - df: 当前加载的数据（DataFrame）
    - insights: 收集的洞察列表
    - tools: 可用工具的字典
    
    【关键方法】
    - run(): 运行Agent，执行完整的分析流程
    - _call_llm(): 调用大模型
    - _execute_tool(): 执行工具
    """
    
    # ========================================================================
    # 系统提示词（System Prompt）
    # ========================================================================
    # 这是给LLM的"角色设定"，告诉它：
    # 1. 你是谁（数据分析Agent）
    # 2. 你能做什么（有哪些工具）
    # 3. 你应该怎么做（工作流程）
    # 4. 你应该怎么输出（JSON格式）
    # 
    # 注意：{tools_description} 是一个占位符，会在运行时被替换为实际的工具描述
    # {{}} 是转义的花括号，在format时不会被替换
    # ========================================================================
    
    SYSTEM_PROMPT = """你是一个专业的数据分析Agent。你的任务是分析用户提供的数据文件，并生成有价值的洞察。

你可以使用以下工具来完成分析任务：

{tools_description}

## 工作流程

1. 首先使用 `load_data` 加载数据文件
2. 使用 `data_overview` 了解数据的基本情况
3. 使用 `data_quality_check` 检查数据质量
4. 根据数据特点，选择合适的分析工具：
   - 数值数据：使用 `describe_numeric`、`correlation_analysis`、`detect_outliers`
   - 分类数据：使用 `describe_categorical`、`group_analysis`
5. 在分析过程中，使用 `generate_insight` 记录重要发现
6. 最后使用 `final_answer` 输出完整的分析报告

## 输出格式

每次回复必须严格按照以下JSON格式：

```json
{{
    "thought": "你的思考过程，分析当前状态和下一步计划",
    "action": "要调用的工具名称",
    "action_input": {{工具参数}}
}}
```

当分析完成时，使用 `final_answer` 工具输出结果。

## 注意事项

- 每次只调用一个工具
- 根据工具返回的观察结果调整分析策略
- 关注数据质量问题和异常值
- 尝试发现数据中的模式和关联
- 给出可操作的建议
"""
    
    def __init__(self, task_id: str, callback_url: str):
        """
        初始化Agent
        
        参数:
            task_id: 任务ID，用于跟踪任务状态和更新进度
            callback_url: 回调URL，分析完成后通知前端
        """
        self.task_id = task_id
        self.callback_url = callback_url
        
        # 初始化记忆系统
        self.memory = AgentMemory()
        
        # 当前加载的数据，初始为None
        self.df: Optional[pd.DataFrame] = None
        
        # 收集的洞察列表
        self.insights: List[Dict[str, Any]] = []
        
        # ====================================================================
        # 注册所有可用的工具
        # ====================================================================
        # 这里创建了所有工具的实例，并存储在字典中
        # 键是工具名称，值是工具实例
        # Agent通过工具名称来查找和调用工具
        # ====================================================================
        self.tools: Dict[str, Tool] = {
            "load_data": LoadDataTool(),              # 加载数据
            "data_overview": DataOverviewTool(),      # 数据概览
            "describe_numeric": DescribeNumericTool(),    # 数值统计
            "describe_categorical": DescribeCategoricalTool(),  # 分类统计
            "correlation_analysis": CorrelationAnalysisTool(),  # 相关性分析
            "detect_outliers": OutlierDetectionTool(),    # 异常值检测
            "group_analysis": GroupAnalysisTool(),        # 分组分析
            "data_quality_check": DataQualityCheckTool(), # 数据质量检查
            "generate_insight": GenerateInsightTool(),    # 生成洞察
            "final_answer": FinalAnswerTool(),            # 最终答案
        }
    
    def _get_tools_description(self) -> str:
        """
        生成工具描述文本
        
        这个方法遍历所有注册的工具，生成一个格式化的描述文本。
        这个文本会被插入到系统提示词中，让LLM知道有哪些工具可用。
        
        返回:
            格式化的工具描述字符串
        """
        descriptions = []
        for name, tool in self.tools.items():
            # 将参数定义转换为JSON字符串，便于阅读
            params_str = json.dumps(tool.parameters, ensure_ascii=False, indent=2)
            descriptions.append(f"### {name}\n{tool.description}\n参数: {params_str}")
        return "\n\n".join(descriptions)
    
    def _build_prompt(self, user_query: str, file_name: str) -> str:
        """
        构建提示词
        
        这个方法构建发送给LLM的提示词，包括：
        1. 系统提示词（定义Agent的角色和能力）
        2. 用户消息（包含文件名和用户需求）
        
        参数:
            user_query: 用户的自然语言分析需求
            file_name: 要分析的文件名
            
        返回:
            (system_prompt, user_message) 元组
        """
        # 将工具描述插入系统提示词
        system = self.SYSTEM_PROMPT.format(tools_description=self._get_tools_description())
        
        # 构建用户消息
        user_message = f"""请分析以下数据文件：

文件名: {file_name}

用户需求: {user_query if user_query else "进行全面的数据分析，发现数据中的模式和洞察"}

请开始分析。"""
        
        return system, user_message
    
    # ========================================================================
    # LLM调用方法
    # ========================================================================
    
    async def _call_llm(self, messages: List[Dict[str, str]]) -> str:
        """
        调用大语言模型（LLM）
        
        【这个方法做什么？】
        将对话消息发送给LLM API，获取模型的响应。
        这是Agent"思考"的核心 - 通过LLM来决定下一步做什么。
        
        【消息格式】
        messages是一个列表，每个元素是一个字典：
        [
            {"role": "system", "content": "系统提示词"},
            {"role": "user", "content": "用户消息"},
            {"role": "assistant", "content": "助手回复"},
            {"role": "user", "content": "观察结果"},
            ...
        ]
        
        参数:
            messages: 对话消息列表
            
        返回:
            LLM的响应文本
        """
        # 如果没有配置API Key，使用模拟响应
        # 这样即使没有LLM API，也可以演示Agent的工作流程
        if not LLM_API_KEY:
            return await self._mock_llm_response(messages)
        
        try:
            # 使用httpx发送异步HTTP请求
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    LLM_API_URL,  # API地址
                    headers={
                        # Bearer Token认证
                        "Authorization": f"Bearer {LLM_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": LLM_MODEL,      # 模型名称
                        "messages": messages,     # 对话消息
                        "temperature": 0.7,       # 温度参数，控制随机性（0-1）
                        "max_tokens": 2000        # 最大生成token数
                    },
                    timeout=60.0  # 超时时间60秒
                )
                # 如果HTTP状态码不是2xx，抛出异常
                response.raise_for_status()
                # 解析JSON响应
                result = response.json()
                # 提取助手的回复内容
                return result["choices"][0]["message"]["content"]
        except Exception as e:
            # 如果调用失败，打印错误并使用模拟响应
            print(f"LLM调用失败: {e}")
            return await self._mock_llm_response(messages)
    
    async def _mock_llm_response(self, messages: List[Dict[str, str]]) -> str:
        """
        模拟LLM响应
        
        【为什么需要这个方法？】
        1. 在没有配置LLM API Key时，仍然可以运行和测试Agent
        2. 用于演示Agent的工作流程
        3. 降低开发和测试成本
        
        【工作原理】
        根据Agent的历史记录，按照预设的分析流程返回下一步的动作。
        这模拟了一个"按部就班"的分析师的行为。
        
        参数:
            messages: 对话消息列表（本方法不使用，但保持接口一致）
            
        返回:
            模拟的LLM响应（JSON格式字符串）
        """
        # 获取Agent的思考历史
        history = self.memory.get_history()
        
        # 按照预设的分析流程，依次执行各个工具
        # 每次检查历史中是否已经执行过某个工具，如果没有就执行它
        
        # 第1步：加载数据
        if "load_data" not in history:
            return json.dumps({
                "thought": "首先需要加载数据文件，了解数据的基本结构",
                "action": "load_data",
                "action_input": {"file_path": "__FILE_PATH__", "file_name": "__FILE_NAME__"}
            }, ensure_ascii=False)
        
        # 第2步：数据概览
        if "data_overview" not in history:
            return json.dumps({
                "thought": "数据已加载，现在获取数据概览，了解基本情况",
                "action": "data_overview",
                "action_input": {}
            }, ensure_ascii=False)
        
        # 第3步：数据质量检查
        if "data_quality_check" not in history:
            return json.dumps({
                "thought": "接下来检查数据质量，发现潜在问题",
                "action": "data_quality_check",
                "action_input": {}
            }, ensure_ascii=False)
        
        # 第4步：数值列统计
        if "describe_numeric" not in history:
            return json.dumps({
                "thought": "对数值列进行统计分析",
                "action": "describe_numeric",
                "action_input": {}
            }, ensure_ascii=False)
        
        # 第5步：分类列统计
        if "describe_categorical" not in history:
            return json.dumps({
                "thought": "对分类列进行分析",
                "action": "describe_categorical",
                "action_input": {}
            }, ensure_ascii=False)
        
        # 第6步：相关性分析
        if "correlation_analysis" not in history:
            return json.dumps({
                "thought": "分析变量之间的相关性",
                "action": "correlation_analysis",
                "action_input": {"threshold": 0.3}
            }, ensure_ascii=False)
        
        # 第7步：异常值检测
        if "detect_outliers" not in history:
            return json.dumps({
                "thought": "检测数据中的异常值",
                "action": "detect_outliers",
                "action_input": {}
            }, ensure_ascii=False)
        
        # 第8步：生成最终报告
        return json.dumps({
            "thought": "分析已完成，现在生成最终报告",
            "action": "final_answer",
            "action_input": {
                "summary": "数据分析完成。通过对数据的全面分析，我们了解了数据的基本特征、质量状况、统计分布和变量关系。",
                "key_findings": [
                    "数据集结构清晰，包含多种类型的变量",
                    "数据质量整体良好，部分列存在缺失值需要处理",
                    "数值变量之间存在一定的相关性",
                    "检测到部分异常值，建议进一步核实"
                ],
                "recommendations": [
                    "建议对缺失值进行适当处理",
                    "对异常值进行业务核实",
                    "可以基于相关性分析进行特征选择",
                    "建议进行更深入的业务分析"
                ]
            }
        }, ensure_ascii=False)
    
    # ========================================================================
    # 工具执行方法
    # ========================================================================
    
    async def _execute_tool(self, action: str, action_input: Dict[str, Any]) -> ToolResult:
        """
        执行指定的工具
        
        【这个方法做什么？】
        根据LLM的决策，调用相应的工具并返回结果。
        这是Agent"行动"的核心。
        
        【执行流程】
        1. 检查工具是否存在
        2. 注入DataFrame上下文（如果已加载数据）
        3. 调用工具的execute方法
        4. 处理特殊情况（如保存DataFrame、收集洞察）
        5. 返回执行结果
        
        参数:
            action: 工具名称
            action_input: 工具参数
            
        返回:
            ToolResult: 工具执行结果
        """
        # 检查工具是否存在
        if action not in self.tools:
            return ToolResult(False, f"未知的工具: {action}")
        
        # 获取工具实例
        tool = self.tools[action]
        
        # 注入DataFrame上下文
        # 大多数工具需要操作数据，我们自动将当前的DataFrame传给它们
        if self.df is not None:
            action_input["df"] = self.df
        
        # 调用工具的execute方法
        # **action_input: 将字典解包为关键字参数
        result = await tool.execute(**action_input)
        
        # 特殊处理：如果是load_data工具，保存返回的DataFrame
        if action == "load_data" and result.success and result.data is not None:
            self.df = result.data
        
        # 特殊处理：如果是generate_insight工具，收集洞察
        if action == "generate_insight" and result.success:
            self.insights.append(result.data)
        
        return result
    
    # ========================================================================
    # Agent主运行方法 - ReAct循环的核心
    # ========================================================================
    
    async def run(self, file_path: str, file_name: str, user_query: str = "") -> Dict[str, Any]:
        """
        运行Agent，执行完整的数据分析流程
        
        【这是Agent最核心的方法！】
        这个方法实现了完整的ReAct循环：
        
        ┌─────────────────────────────────────────────────────────────┐
        │                      ReAct 循环                              │
        │                                                             │
        │   ┌─────────┐    ┌─────────┐    ┌─────────┐               │
        │   │  思考   │ -> │  行动   │ -> │  观察   │ -> 循环...     │
        │   │(LLM决策)│    │(执行工具)│    │(获取结果)│               │
        │   └─────────┘    └─────────┘    └─────────┘               │
        │                                                             │
        │   直到调用 final_answer 或达到最大迭代次数                    │
        └─────────────────────────────────────────────────────────────┘
        
        参数:
            file_path: 要分析的文件路径
            file_name: 文件名
            user_query: 用户的自然语言分析需求
            
        返回:
            Dict: 包含分析结果、思考过程、洞察等的完整报告
        """
        # 构建提示词
        system_prompt, user_message = self._build_prompt(user_query, file_name)
        
        # 初始化对话消息列表
        # 这个列表会随着对话进行不断增长
        messages = [
            {"role": "system", "content": system_prompt},  # 系统提示词
            {"role": "user", "content": user_message}       # 用户消息
        ]
        
        # 迭代计数器
        iteration = 0
        # 最终结果
        final_result = None
        
        # ====================================================================
        # ReAct 主循环
        # ====================================================================
        # 这个循环会一直执行，直到：
        # 1. Agent调用final_answer工具（正常完成）
        # 2. 达到最大迭代次数（防止无限循环）
        # ====================================================================
        
        while iteration < MAX_AGENT_ITERATIONS:
            iteration += 1
            
            # 计算进度百分比（10% - 90%之间）
            # 保留10%给初始化，10%给最终处理
            progress = min(10 + iteration * 6, 90)
            
            # 更新任务进度并通知前端
            tasks_store[self.task_id]["progress"] = progress
            await send_callback(self.callback_url, {"status": "processing", "progress": progress})
            
            # ================================================================
            # 第1步：思考（Reasoning）- 调用LLM获取决策
            # ================================================================
            response = await self._call_llm(messages)
            
            # ================================================================
            # 第2步：解析LLM的响应
            # ================================================================
            # LLM应该返回JSON格式的响应，包含thought、action、action_input
            # 但有时LLM可能会用markdown代码块包裹JSON，需要提取
            try:
                response_clean = response
                
                # 尝试从markdown代码块中提取JSON
                if "```json" in response:
                    # 格式: ```json\n{...}\n```
                    response_clean = response.split("```json")[1].split("```")[0]
                elif "```" in response:
                    # 格式: ```\n{...}\n```
                    response_clean = response.split("```")[1].split("```")[0]
                
                # 解析JSON
                parsed = json.loads(response_clean.strip())
                thought = parsed.get("thought", "")      # Agent的思考
                action = parsed.get("action", "")        # 要执行的工具
                action_input = parsed.get("action_input", {})  # 工具参数
                
            except json.JSONDecodeError:
                # 如果JSON解析失败，要求LLM重新输出
                # 这是一种错误恢复机制
                messages.append({"role": "assistant", "content": response})
                messages.append({"role": "user", "content": "请按照指定的JSON格式输出。"})
                continue  # 跳过本次迭代，重新调用LLM
            
            # ================================================================
            # 第3步：处理占位符
            # ================================================================
            # 模拟模式下，LLM不知道实际的文件路径，使用占位符
            # 这里将占位符替换为实际值
            if "__FILE_PATH__" in str(action_input):
                action_input["file_path"] = file_path
            if "__FILE_NAME__" in str(action_input):
                action_input["file_name"] = file_name
            
            # ================================================================
            # 第4步：行动（Acting）- 执行工具
            # ================================================================
            result = await self._execute_tool(action, action_input)
            
            # ================================================================
            # 第5步：记录思考过程
            # ================================================================
            # 将这次的思考-行动-观察记录到记忆系统
            thought_record = AgentThought(
                thought=thought,
                action=action,
                action_input=action_input,
                observation=result.output
            )
            self.memory.add_thought(thought_record)
            
            # ================================================================
            # 第6步：更新对话历史
            # ================================================================
            # 将LLM的响应和工具的观察结果添加到消息列表
            # 这样下一轮LLM调用时，它能看到之前的所有交互
            messages.append({"role": "assistant", "content": response})
            messages.append({"role": "user", "content": f"Observation: {result.output}"})
            
            # ================================================================
            # 第7步：检查是否完成
            # ================================================================
            # 如果Agent调用了final_answer工具，说明分析完成
            if action == "final_answer" and result.success:
                final_result = result.data
                break  # 退出循环
        
        # ====================================================================
        # 构建最终报告
        # ====================================================================
        
        # 如果没有正常完成（达到最大迭代次数），创建一个默认报告
        if final_result is None:
            final_result = {
                "summary": "分析过程中断",
                "key_findings": [],
                "recommendations": []
            }
        
        # 添加Agent的思考过程（用于调试和展示）
        # 截断过长的观察结果，避免报告过大
        final_result["agent_thoughts"] = [
            {
                "thought": t.thought,
                "action": t.action,
                "observation": t.observation[:500] if len(t.observation) > 500 else t.observation
            }
            for t in self.memory.thoughts
        ]
        
        # 添加收集的洞察
        final_result["insights"] = self.insights
        
        # 添加迭代次数（用于了解Agent执行了多少步）
        final_result["iterations"] = iteration
        
        # 添加数据基本信息
        if self.df is not None:
            final_result["data_info"] = {
                "totalRows": len(self.df),
                "columns": len(self.df.columns),
                "columnNames": self.df.columns.tolist()
            }
        
        return final_result


# ============================================================================
# 第5部分：API 路由（FastAPI接口）
# ============================================================================
# 
# 这部分定义了服务对外提供的HTTP API接口。
# 前端（Next.js）通过这些接口与Agent服务交互。
# 
# 【API列表】
# 1. GET  /health              - 健康检查
# 2. POST /api/analyze         - 提交分析任务
# 3. GET  /api/task/{id}/status - 查询任务状态
# 4. POST /api/task/{id}/cancel - 取消任务
# ============================================================================

@app.get("/health")
async def health_check():
    """
    健康检查接口
    
    【用途】
    用于检查服务是否正常运行。前端或负载均衡器可以定期调用此接口。
    
    【返回信息】
    - status: 服务状态（"ok"表示正常）
    - timestamp: 当前时间
    - version: 服务版本
    - agent_enabled: Agent功能是否启用
    - llm_configured: LLM API是否已配置
    """
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "agent_enabled": True,
        "llm_configured": bool(LLM_API_KEY)  # 如果有API Key则为True
    }


@app.post("/api/analyze")
async def submit_analysis(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    """
    提交分析任务接口
    
    【用途】
    前端调用此接口提交数据分析任务。任务会在后台异步执行，
    接口立即返回，不会阻塞。
    
    【工作流程】
    1. 接收请求，验证参数（由Pydantic自动完成）
    2. 在tasks_store中创建任务记录
    3. 将分析任务添加到后台任务队列
    4. 立即返回成功响应
    5. 后台任务执行完成后，通过callback_url通知前端
    
    【什么是BackgroundTasks？】
    FastAPI提供的后台任务机制。添加到BackgroundTasks的函数会在
    响应返回后异步执行，不会阻塞当前请求。
    
    参数:
        request: AnalyzeRequest对象，包含任务信息
        background_tasks: FastAPI的后台任务管理器
        
    返回:
        成功响应，包含success和message字段
    """
    # 在任务存储中创建新任务记录
    tasks_store[request.task_id] = {
        "status": TaskStatus.PENDING,  # 初始状态：等待中
        "progress": 0,                  # 初始进度：0%
        "result": None,                 # 结果：暂无
        "error": None,                  # 错误：暂无
    }
    
    # 将分析任务添加到后台执行
    # add_task的第一个参数是要执行的函数，后面是函数的参数
    background_tasks.add_task(
        run_agent_analysis,      # 要执行的函数
        request.task_id,         # 任务ID
        request.file_path,       # 文件路径
        request.file_name,       # 文件名
        request.callback_url,    # 回调URL
        request.user_query,      # 用户需求
        request.options,         # 额外选项
    )
    
    # 立即返回成功响应
    return {"success": True, "message": "Agent任务已提交"}


@app.get("/api/task/{task_id}/status", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """
    查询任务状态接口
    
    【用途】
    前端可以轮询此接口获取任务的当前状态和进度。
    
    【路径参数】
    task_id: 任务ID（在URL中，如 /api/task/abc123/status）
    
    【response_model的作用】
    指定响应的数据模型，FastAPI会自动：
    1. 验证响应数据是否符合模型
    2. 生成API文档
    3. 序列化响应
    
    返回:
        TaskStatusResponse对象，包含status、progress、result、error
    """
    # 检查任务是否存在
    if task_id not in tasks_store:
        # 如果不存在，返回404错误
        raise HTTPException(status_code=404, detail="任务不存在")
    
    # 返回任务状态
    return tasks_store[task_id]


@app.post("/api/task/{task_id}/cancel")
async def cancel_task(task_id: str):
    """
    取消任务接口
    
    【用途】
    用户可以取消正在执行的任务。
    
    【注意】
    由于Agent是在后台异步执行的，取消操作只是将任务状态标记为失败，
    实际的Agent执行可能不会立即停止。
    
    参数:
        task_id: 任务ID
        
    返回:
        成功响应
    """
    # 检查任务是否存在
    if task_id not in tasks_store:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    # 将任务状态设为失败，并记录取消原因
    tasks_store[task_id]["status"] = TaskStatus.FAILED
    tasks_store[task_id]["error"] = "任务已取消"
    
    return {"success": True}


# ============================================================================
# 后台任务函数
# ============================================================================

async def run_agent_analysis(
    task_id: str,
    file_path: str,
    file_name: str,
    callback_url: str,
    user_query: str,
    options: Dict[str, Any],
):
    """
    运行Agent分析（后台任务）
    
    【这个函数做什么？】
    这是实际执行Agent分析的函数，在后台异步运行。
    
    【执行流程】
    1. 更新任务状态为"处理中"
    2. 创建Agent实例
    3. 运行Agent分析
    4. 更新任务状态为"完成"或"失败"
    5. 通过回调URL通知前端
    
    参数:
        task_id: 任务ID
        file_path: 要分析的文件路径
        file_name: 文件名
        callback_url: 回调URL
        user_query: 用户的分析需求
        options: 额外选项
    """
    try:
        # 更新状态为处理中
        tasks_store[task_id]["status"] = TaskStatus.PROCESSING
        # 发送初始进度通知
        await send_callback(callback_url, {"status": "processing", "progress": 5})
        
        # 创建Agent实例并运行
        agent = DataAnalysisAgent(task_id, callback_url)
        result = await agent.run(file_path, file_name, user_query)
        
        # 分析完成，更新状态
        tasks_store[task_id]["status"] = TaskStatus.COMPLETED
        tasks_store[task_id]["progress"] = 100
        tasks_store[task_id]["result"] = result
        
        # 发送完成回调，通知前端
        await send_callback(callback_url, {
            "status": "completed",
            "progress": 100,
            "result": result,
            "reportName": f"{file_name} - Agent分析报告",
            "reportType": "json",
        })
        
    except Exception as e:
        # 发生异常，更新状态为失败
        error_msg = str(e)
        tasks_store[task_id]["status"] = TaskStatus.FAILED
        tasks_store[task_id]["error"] = error_msg
        
        # 发送失败回调
        await send_callback(callback_url, {
            "status": "failed",
            "error": error_msg,
        })


async def send_callback(callback_url: str, data: Dict[str, Any]):
    """
    发送回调请求到前端
    
    【用途】
    Agent分析过程中和完成后，通过HTTP POST请求通知前端。
    前端可以据此更新UI显示进度或结果。
    
    【为什么需要回调？】
    因为分析是异步执行的，前端不知道什么时候完成。
    通过回调机制，后端可以主动通知前端，而不是让前端不断轮询。
    
    参数:
        callback_url: 前端提供的回调URL
        data: 要发送的数据
    """
    try:
        # 使用httpx发送异步POST请求
        async with httpx.AsyncClient() as client:
            await client.post(
                callback_url,
                json=data,  # 自动将字典序列化为JSON
                headers={"Content-Type": "application/json"},
                timeout=10.0,  # 10秒超时
            )
    except Exception as e:
        # 回调失败不应该影响主流程，只打印错误
        print(f"发送回调失败: {e}")


# ============================================================================
# 第6部分：Excel数据处理API
# ============================================================================
# 
# 这部分提供Excel文件的上传、处理和下载功能
# 主要用于处理特定格式的实验数据，进行线性/非线性分离计算
# ============================================================================

from fastapi import File, UploadFile
from fastapi.responses import StreamingResponse
from excel_processor import process_excel_file, CalculationParams

# 存储处理后的文件，用于下载
processed_files_store: Dict[str, bytes] = {}


class ExcelProcessRequest(BaseModel):
    """Excel处理请求参数"""
    slope_b: float = -0.4823  # B组斜率
    slope_e: float = 0.4557   # E组斜率


@app.post("/api/excel/upload")
async def upload_excel(file: UploadFile = File(...)):
    """
    上传Excel文件并处理
    
    【功能】
    1. 接收上传的Excel文件
    2. 使用默认参数进行数据处理
    3. 返回处理结果和下载ID
    
    参数:
        file: 上传的Excel文件
        
    返回:
        处理结果，包含下载ID
    """
    try:
        # 读取文件内容
        content = await file.read()
        
        # 处理文件
        result = process_excel_file(file_content=content)
        
        if not result.success:
            return {"success": False, "message": result.message}
        
        # 生成下载ID并存储处理后的文件
        import uuid
        download_id = str(uuid.uuid4())
        processed_files_store[download_id] = result.output_file
        
        # 提取结果摘要
        summary = []
        if result.data and "results" in result.data:
            for r in result.data["results"]:
                summary.append({
                    "group": r["group_index"],
                    "b_value": round(r["b_value"], 6),
                    "y3_last": round(r["y3_last"], 6),
                    "b_group_count": r["b_group"]["data_count"],
                    "e_group_count": r["e_group"]["data_count"]
                })
        
        return {
            "success": True,
            "message": result.message,
            "download_id": download_id,
            "summary": summary,
            "original_filename": file.filename
        }
        
    except Exception as e:
        return {"success": False, "message": f"处理失败: {str(e)}"}


@app.post("/api/excel/process")
async def process_excel_with_params(
    file: UploadFile = File(...),
    slope_b: float = -0.4823,
    slope_e: float = 0.4557
):
    """
    上传Excel文件并使用自定义参数处理
    
    【功能】
    允许用户自定义斜率参数进行计算
    
    参数:
        file: 上传的Excel文件
        slope_b: B组斜率，默认-0.4823
        slope_e: E组斜率，默认0.4557
        
    返回:
        处理结果，包含下载ID
    """
    try:
        content = await file.read()
        
        result = process_excel_file(
            file_content=content,
            slope_b=slope_b,
            slope_e=slope_e
        )
        
        if not result.success:
            return {"success": False, "message": result.message}
        
        import uuid
        download_id = str(uuid.uuid4())
        processed_files_store[download_id] = result.output_file
        
        summary = []
        if result.data and "results" in result.data:
            for r in result.data["results"]:
                summary.append({
                    "group": r["group_index"],
                    "b_value": round(r["b_value"], 6),
                    "y3_last": round(r["y3_last"], 6),
                    "b_group_count": r["b_group"]["data_count"],
                    "e_group_count": r["e_group"]["data_count"]
                })
        
        return {
            "success": True,
            "message": result.message,
            "download_id": download_id,
            "summary": summary,
            "original_filename": file.filename,
            "params": {
                "slope_b": slope_b,
                "slope_e": slope_e
            }
        }
        
    except Exception as e:
        return {"success": False, "message": f"处理失败: {str(e)}"}


@app.get("/api/excel/download/{download_id}")
async def download_processed_excel(download_id: str, filename: str = "processed_result.xlsx"):
    """
    下载处理后的Excel文件
    
    参数:
        download_id: 处理时返回的下载ID
        filename: 下载的文件名
        
    返回:
        Excel文件流
    """
    if download_id not in processed_files_store:
        raise HTTPException(status_code=404, detail="文件不存在或已过期")
    
    file_content = processed_files_store[download_id]
    
    # 创建流式响应
    from io import BytesIO
    file_stream = BytesIO(file_content)
    
    return StreamingResponse(
        file_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@app.delete("/api/excel/download/{download_id}")
async def delete_processed_file(download_id: str):
    """
    删除处理后的文件（清理存储）
    
    参数:
        download_id: 下载ID
    """
    if download_id in processed_files_store:
        del processed_files_store[download_id]
        return {"success": True, "message": "文件已删除"}
    return {"success": False, "message": "文件不存在"}


# ============================================================================
# 第6.5部分：报告生成API
# ============================================================================

from report_generator import ReportGeneratorAgent, get_agent

# 报告生成请求模型
class ReportGenerateRequest(BaseModel):
    """报告生成请求"""
    user_id: str
    excel_files: List[str]  # Excel文件路径列表
    user_requirement: str   # 用户分析需求
    task_description: str = ""  # 新增：任务/目标描述
    report_title: str = "数据分析报告"
    output_format: str = "word"  # word 或 ppt


@app.post("/api/report/generate")
async def generate_report(request: ReportGenerateRequest, background_tasks: BackgroundTasks):
    """
    创建报告生成任务
    
    这个接口会立即返回任务ID，报告生成在后台进行。
    可以通过 /api/report/status/{task_id} 查询进度。
    """
    try:
        agent = get_agent(output_dir="./reports")
        
        # 创建任务
        task = agent.create_task(
            user_id=request.user_id,
            excel_files=request.excel_files,
            user_requirement=request.user_requirement,
            task_description=request.task_description,
            report_title=request.report_title,
            output_format=request.output_format
        )
        
        # 在后台处理任务
        background_tasks.add_task(agent.process_task, task.task_id)
        
        return {
            "success": True,
            "task_id": task.task_id,
            "message": "报告生成任务已创建",
            "task": task.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/status/{task_id}")
async def get_report_status(task_id: str):
    """
    查询报告生成任务状态
    """
    agent = get_agent()
    task = agent.get_task(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    return {
        "success": True,
        "task": task.to_dict()
    }


@app.get("/api/report/download/{task_id}")
async def download_report(task_id: str):
    """
    下载生成的报告
    """
    from fastapi.responses import FileResponse
    
    agent = get_agent()
    task = agent.get_task(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    if task.status.value != "completed":
        raise HTTPException(status_code=400, detail=f"报告尚未生成完成，当前状态: {task.status.value}")
    
    if not task.output_path or not os.path.exists(task.output_path):
        raise HTTPException(status_code=404, detail="报告文件不存在")
    
    filename = os.path.basename(task.output_path)
    
    # 根据文件类型设置媒体类型
    if filename.endswith('.docx'):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif filename.endswith('.pptx'):
        media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    else:
        media_type = "application/octet-stream"
    
    return FileResponse(
        task.output_path,
        media_type=media_type,
        filename=filename
    )


@app.get("/api/report/list/{user_id}")
async def list_user_reports(user_id: str):
    """
    获取用户的所有报告任务
    """
    agent = get_agent()
    tasks = agent.get_user_tasks(user_id)
    
    return {
        "success": True,
        "tasks": [t.to_dict() for t in tasks]
    }


# ============================================================================
# 第6.5部分：数据分析与图表生成API
# ============================================================================

class DataAnalysisRequest(BaseModel):
    """数据分析请求模型"""
    data: List[Dict[str, Any]]
    prompt: str
    chart_type: str = "bar"
    x_axis: Optional[str] = None
    y_axis: Optional[List[str]] = None

class ChartGenerationRequest(BaseModel):
    """图表生成请求模型"""
    data: List[Dict[str, Any]]
    chart_type: str = "bar"
    title: str = "数据分析图表"
    x_axis: str
    y_axis: List[str]
    aggregation: str = "sum"

@app.post("/api/data-analysis/analyze")
async def analyze_data(request: DataAnalysisRequest):
    """
    智能数据分析API
    根据用户的自然语言提示分析数据并返回结果
    """
    try:
        data = request.data
        prompt = request.prompt
        chart_type = request.chart_type
        
        if not data:
            raise HTTPException(status_code=400, detail="数据不能为空")
        
        # 转换为DataFrame进行分析
        df = pd.DataFrame(data)
        
        # 获取列信息
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        
        # 自动选择X轴和Y轴
        x_axis = request.x_axis or (categorical_cols[0] if categorical_cols else df.columns[0])
        y_axis = request.y_axis or (numeric_cols[:3] if numeric_cols else [df.columns[1]] if len(df.columns) > 1 else [])
        
        # 数据聚合
        if x_axis in df.columns:
            aggregated = df.groupby(x_axis)[y_axis].sum().reset_index()
            aggregated = aggregated.sort_values(by=y_axis[0] if y_axis else x_axis, ascending=False)
            aggregated = aggregated.head(20)
            chart_data = aggregated.to_dict('records')
        else:
            chart_data = data[:20]
        
        # 生成分析摘要
        total_records = len(df)
        unique_categories = df[x_axis].nunique() if x_axis in df.columns else 0
        
        summary_parts = [
            f"📊 **数据分析结果**",
            f"根据您的需求「{prompt}」，分析结果如下：",
            f"- 共分析 **{total_records}** 条记录",
            f"- 按 **{x_axis}** 维度分类，共 **{unique_categories}** 个类别",
        ]
        
        if y_axis and y_axis[0] in df.columns:
            max_val = df[y_axis[0]].max()
            min_val = df[y_axis[0]].min()
            avg_val = df[y_axis[0]].mean()
            max_idx = df[y_axis[0]].idxmax()
            min_idx = df[y_axis[0]].idxmin()
            
            max_item = df.loc[max_idx, x_axis] if x_axis in df.columns else max_idx
            min_item = df.loc[min_idx, x_axis] if x_axis in df.columns else min_idx
            
            summary_parts.extend([
                f"- 分析指标: {', '.join(y_axis)}",
                f"\n**关键发现:**",
                f"- 最高值: **{max_item}** ({max_val:,.2f})",
                f"- 最低值: **{min_item}** ({min_val:,.2f})",
                f"- 平均值: **{avg_val:,.2f}**",
            ])
        
        return {
            "success": True,
            "summary": "\n".join(summary_parts),
            "chart_config": {
                "type": chart_type,
                "title": f"{x_axis} 数据分析",
                "xAxis": x_axis,
                "yAxis": y_axis,
                "showLegend": len(y_axis) > 1,
                "showGrid": True,
            },
            "chart_data": chart_data,
            "statistics": {
                "total_records": total_records,
                "unique_categories": unique_categories,
                "numeric_columns": numeric_cols,
                "categorical_columns": categorical_cols,
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")


@app.post("/api/data-analysis/compare")
async def compare_datasets(request: Dict[str, Any]):
    """
    多数据集对比分析API
    对比多个数据集之间的差异
    """
    try:
        datasets = request.get("datasets", [])
        compare_column = request.get("compare_column")
        value_column = request.get("value_column")
        
        if len(datasets) < 2:
            raise HTTPException(status_code=400, detail="至少需要2个数据集进行对比")
        
        results = []
        for i, dataset in enumerate(datasets):
            df = pd.DataFrame(dataset.get("data", []))
            name = dataset.get("name", f"数据集{i+1}")
            
            if compare_column and compare_column in df.columns:
                grouped = df.groupby(compare_column)[value_column].sum().reset_index()
                grouped["_source"] = name
                results.append(grouped)
        
        if results:
            combined = pd.concat(results, ignore_index=True)
            chart_data = combined.to_dict('records')
        else:
            chart_data = []
        
        return {
            "success": True,
            "message": f"成功对比 {len(datasets)} 个数据集",
            "chart_data": chart_data,
            "chart_config": {
                "type": "grouped-bar",
                "title": "数据集对比分析",
                "xAxis": compare_column,
                "yAxis": [value_column],
                "groupBy": "_source",
                "showLegend": True,
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"对比分析失败: {str(e)}")


@app.post("/api/data-analysis/statistics")
async def get_statistics(request: Dict[str, Any]):
    """
    获取数据统计信息API
    """
    try:
        data = request.get("data", [])
        if not data:
            raise HTTPException(status_code=400, detail="数据不能为空")
        
        df = pd.DataFrame(data)
        
        stats = {
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": []
        }
        
        for col in df.columns:
            col_stats = {
                "name": col,
                "type": str(df[col].dtype),
                "null_count": int(df[col].isnull().sum()),
                "unique_count": int(df[col].nunique()),
            }
            
            if pd.api.types.is_numeric_dtype(df[col]):
                col_stats.update({
                    "min": float(df[col].min()) if not pd.isna(df[col].min()) else None,
                    "max": float(df[col].max()) if not pd.isna(df[col].max()) else None,
                    "mean": float(df[col].mean()) if not pd.isna(df[col].mean()) else None,
                    "std": float(df[col].std()) if not pd.isna(df[col].std()) else None,
                })
            else:
                top_values = df[col].value_counts().head(5).to_dict()
                col_stats["top_values"] = {str(k): int(v) for k, v in top_values.items()}
            
            stats["columns"].append(col_stats)
        
        return {
            "success": True,
            "statistics": stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"统计分析失败: {str(e)}")


# ============================================================================
# 第6.5部分：基因编辑数据处理API
# ============================================================================
# 
# 用于处理作物学/分子生物技术/大豆毛状根技术应用基因编辑的数据
# 支持数据化简、序列提取、突变分析等功能

from report_generator.gene_editing_processor import GeneEditingProcessor, simplify_gene_editing_file
from report_generator.mutation_highlighter import highlight_mutations


class GeneEditingSimplifyRequest(BaseModel):
    """基因编辑数据化简请求"""
    file_path: str                    # 文件路径
    output_path: Optional[str] = None # 输出路径（可选）


class MutationHighlightRequest(BaseModel):
    """突变高亮请求"""
    file_path: str                                           # 文件路径
    output_path: Optional[str] = None                        # 输出路径（可选）
    target_sequence: str = "TGGAGACACTAGAGGGATGG"            # 目标20bp序列
    original_filename: Optional[str] = None                  # 原始文件名（用于生成输出文件名）


class GeneEditingAnalyzeRequest(BaseModel):
    """基因编辑数据分析请求"""
    task_id: str
    file_path: str
    file_name: str
    user_query: str = ""
    callback_url: str
    domain: str = "gene_editing"  # 分析领域


@app.post("/api/gene-editing/simplify")
async def simplify_gene_editing_data(request: GeneEditingSimplifyRequest):
    """
    基因编辑数据化简API
    
    功能：
    1. 解析基因编辑序列数据文件
    2. 提取每个序号的WT行和高亮行
    3. 提取20个目标碱基（红色标记）
    4. 生成化简后的Excel文件
    
    请求参数：
    - file_path: 输入文件路径
    - output_path: 输出文件路径（可选，默认在原文件目录生成）
    
    返回：
    - success: 是否成功
    - output_file: 输出文件路径
    - summary: 处理摘要
    - results: 化简结果列表
    """
    import traceback
    
    # 【修复】处理文件路径，确保正确编码和规范化
    file_path = request.file_path
    if file_path:
        # 规范化路径（处理正斜杠/反斜杠混用问题）
        file_path = os.path.normpath(file_path)
        # 确保路径是UTF-8编码
        if isinstance(file_path, bytes):
            file_path = file_path.decode('utf-8')
    
    output_path = request.output_path
    if output_path:
        output_path = os.path.normpath(output_path)
    
    print(f"[gene-editing/simplify] 收到请求: file_path={file_path}, output_path={output_path}")
    print(f"[gene-editing/simplify] 路径字节表示: {file_path.encode('utf-8') if file_path else None}")
    
    # 验证文件路径
    if not file_path:
        print("[gene-editing/simplify] 错误: 缺少file_path参数")
        raise HTTPException(status_code=400, detail="缺少file_path参数")
    
    # 检查文件是否存在（使用pathlib处理Unicode路径）
    from pathlib import Path
    path_obj = Path(file_path)
    
    if not path_obj.exists():
        print(f"[gene-editing/simplify] 错误: 文件不存在 - {file_path}")
        print(f"[gene-editing/simplify] 尝试的路径: {path_obj.absolute()}")
        raise HTTPException(status_code=404, detail=f"文件不存在: {file_path}")
    
    # 检查文件扩展名
    file_ext = path_obj.suffix.lower()
    if file_ext not in ['.xlsx', '.xls']:
        print(f"[gene-editing/simplify] 错误: 不支持的文件格式 - {file_ext}")
        raise HTTPException(status_code=400, detail=f"不支持的文件格式: {file_ext}，请上传Excel文件(.xlsx或.xls)")
    
    try:
        print(f"[gene-editing/simplify] 开始处理文件: {file_path}")
        result = simplify_gene_editing_file(str(path_obj), output_path)
        print(f"[gene-editing/simplify] 处理成功, 结果条数: {result.get('total_entries', 0)}")
        return result
    except FileNotFoundError as e:
        print(f"[gene-editing/simplify] FileNotFoundError: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        print(f"[gene-editing/simplify] ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[gene-editing/simplify] Exception: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"数据化简失败: {str(e)}")


class GeneEditingSortRequest(BaseModel):
    """基因编辑数据排序请求"""
    file_path: str
    output_path: Optional[str] = None
    original_filename: Optional[str] = None


@app.post("/api/gene-editing/sort")
async def sort_gene_editing_data(request: GeneEditingSortRequest):
    """
    基因编辑数据排序API
    
    功能：
    1. 读取基因编辑序列数据文件
    2. 按序号（如001-refXXX, 002-refXXX）从小到大排序
    3. 生成排序后的Excel文件，保留原始格式和高亮
    
    请求参数：
    - file_path: 输入文件路径
    - output_path: 输出文件路径（可选）
    - original_filename: 原始文件名（可选，用于生成输出文件名）
    
    返回：
    - success: 是否成功
    - output_file: 输出文件路径
    - total_groups: 序列组数量
    - message: 处理信息
    """
    import traceback
    from pathlib import Path
    from report_generator.gene_editing_processor import sort_gene_editing_file
    
    print(f"[gene-editing/sort] 收到请求: file_path={request.file_path}")
    
    # 验证文件路径
    if not request.file_path:
        raise HTTPException(status_code=400, detail="缺少file_path参数")
    
    # 处理文件路径
    file_path = os.path.normpath(request.file_path)
    path_obj = Path(file_path)
    
    if not path_obj.exists():
        print(f"[gene-editing/sort] 错误: 文件不存在 - {file_path}")
        raise HTTPException(status_code=404, detail=f"文件不存在: {file_path}")
    
    # 检查文件扩展名
    file_ext = path_obj.suffix.lower()
    if file_ext not in ['.xlsx', '.xls']:
        raise HTTPException(status_code=400, detail=f"不支持的文件格式: {file_ext}")
    
    try:
        print(f"[gene-editing/sort] 开始处理文件: {file_path}")
        
        # 生成输出路径
        output_path = request.output_path
        if not output_path and request.original_filename:
            original_name = request.original_filename
            base_name = os.path.splitext(original_name)[0]
            output_dir = os.path.dirname(file_path)
            output_path = os.path.join(output_dir, f"{base_name}_sorted.xlsx")
            print(f"[gene-editing/sort] 使用原始文件名生成输出路径: {output_path}")
        
        result = sort_gene_editing_file(str(path_obj), output_path)
        print(f"[gene-editing/sort] 处理成功, 序列组数: {result.get('total_groups', 0)}")
        return result
    except FileNotFoundError as e:
        print(f"[gene-editing/sort] FileNotFoundError: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        print(f"[gene-editing/sort] ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[gene-editing/sort] Exception: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"数据排序失败: {str(e)}")


@app.post("/api/gene-editing/highlight")
async def highlight_mutation_data(request: MutationHighlightRequest):
    """
    突变高亮API
    
    根据突变类型对符合条件的行进行颜色高亮标记
    
    规则：
    1. 前提条件：F列和G列的突变类型必须相同
    2. 高亮颜色：
       - 黄色：C→T 突变
       - 绿色：A→G 突变
       - 橙色：G→A 或 T→C 突变
    
    请求参数：
    - file_path: 输入文件路径
    - output_path: 输出文件路径（可选）
    - target_sequence: 目标20bp序列（默认TGGAGACACTAGAGGGATGG）
    
    返回：
    - success: 是否成功
    - output_file: 输出文件路径
    - total_highlighted: 高亮行数
    - color_statistics: 颜色统计
    - mutation_statistics: 突变类型统计
    """
    import traceback
    from pathlib import Path
    
    print(f"[gene-editing/highlight] 收到请求: file_path={request.file_path}")
    
    # 验证文件路径
    if not request.file_path:
        raise HTTPException(status_code=400, detail="缺少file_path参数")
    
    # 处理文件路径
    file_path = os.path.normpath(request.file_path)
    path_obj = Path(file_path)
    
    if not path_obj.exists():
        print(f"[gene-editing/highlight] 错误: 文件不存在 - {file_path}")
        raise HTTPException(status_code=404, detail=f"文件不存在: {file_path}")
    
    # 检查文件扩展名
    file_ext = path_obj.suffix.lower()
    if file_ext not in ['.xlsx', '.xls']:
        raise HTTPException(status_code=400, detail=f"不支持的文件格式: {file_ext}")
    
    try:
        print(f"[gene-editing/highlight] 开始处理文件: {file_path}")
        
        # 【新增】如果提供了原始文件名，使用它来生成输出路径
        output_path = request.output_path
        if not output_path and request.original_filename:
            # 从原始文件名生成输出文件名
            original_name = request.original_filename
            base_name = os.path.splitext(original_name)[0]
            output_dir = os.path.dirname(file_path)
            output_path = os.path.join(output_dir, f"{base_name}_highlighted.xlsx")
            print(f"[gene-editing/highlight] 使用原始文件名生成输出路径: {output_path}")
        
        result = highlight_mutations(
            str(path_obj), 
            output_path,
            request.target_sequence
        )
        print(f"[gene-editing/highlight] 处理成功, 高亮行数: {result.get('total_highlighted', 0)}")
        return result
    except FileNotFoundError as e:
        print(f"[gene-editing/highlight] FileNotFoundError: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        print(f"[gene-editing/highlight] ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[gene-editing/highlight] Exception: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"突变高亮处理失败: {str(e)}")


@app.post("/api/gene-editing/analyze")
async def analyze_gene_editing_data(request: GeneEditingAnalyzeRequest, background_tasks: BackgroundTasks):
    """
    基因编辑数据分析API
    
    功能：
    1. 解析基因编辑实验数据
    2. 使用AI进行专业分析（作物学/分子生物技术领域）
    3. 生成分析报告
    
    请求参数：
    - task_id: 任务ID
    - file_path: 文件路径
    - file_name: 文件名
    - user_query: 用户分析需求
    - callback_url: 回调URL
    - domain: 分析领域（默认gene_editing）
    """
    # 初始化任务状态
    tasks_store[request.task_id] = {
        "status": TaskStatus.PENDING,
        "progress": 0,
        "result": None,
        "error": None,
        "domain": request.domain
    }
    
    # 在后台执行分析
    background_tasks.add_task(
        run_gene_editing_analysis,
        request.task_id,
        request.file_path,
        request.file_name,
        request.user_query,
        request.callback_url,
        request.domain
    )
    
    return {
        "task_id": request.task_id,
        "status": "accepted",
        "message": "基因编辑数据分析任务已创建"
    }


async def run_gene_editing_analysis(
    task_id: str,
    file_path: str,
    file_name: str,
    user_query: str,
    callback_url: str,
    domain: str = "gene_editing"
):
    """
    执行基因编辑数据分析
    """
    try:
        # 更新状态为处理中
        tasks_store[task_id]["status"] = TaskStatus.PROCESSING
        tasks_store[task_id]["progress"] = 10
        
        # 创建领域特定的分析器
        from report_generator.data_analyzer import DataAnalyzer
        from report_generator.excel_parser import ExcelParser
        
        analyzer = DataAnalyzer(domain=domain)
        parser = ExcelParser()
        
        # 解析Excel文件
        tasks_store[task_id]["progress"] = 30
        excel_data = parser.parse(file_path)
        
        # 执行分析
        tasks_store[task_id]["progress"] = 50
        result = await analyzer.analyze(excel_data, user_query)
        
        # 更新状态为完成
        tasks_store[task_id]["status"] = TaskStatus.COMPLETED
        tasks_store[task_id]["progress"] = 100
        tasks_store[task_id]["result"] = result.to_dict()
        
        # 发送回调
        if callback_url:
            async with httpx.AsyncClient() as client:
                await client.post(callback_url, json={
                    "task_id": task_id,
                    "status": "completed",
                    "result": result.to_dict()
                })
                
    except Exception as e:
        tasks_store[task_id]["status"] = TaskStatus.FAILED
        tasks_store[task_id]["error"] = str(e)
        
        if callback_url:
            async with httpx.AsyncClient() as client:
                await client.post(callback_url, json={
                    "task_id": task_id,
                    "status": "failed",
                    "error": str(e)
                })


@app.post("/api/gene-editing/extract-sequences")
async def extract_target_sequences(request: Dict[str, Any]):
    """
    提取目标序列API
    
    功能：
    从基因编辑数据中提取20bp目标碱基序列
    
    请求参数：
    - file_path: 文件路径
    - sequence_ids: 要提取的序号列表（可选，为空则提取全部）
    """
    try:
        file_path = request.get("file_path")
        sequence_ids = request.get("sequence_ids", [])
        
        if not file_path:
            raise HTTPException(status_code=400, detail="file_path不能为空")
        
        processor = GeneEditingProcessor()
        entries_by_id = processor.parse_gene_editing_file(file_path)
        
        # 如果指定了序号，只提取这些序号
        if sequence_ids:
            entries_by_id = {k: v for k, v in entries_by_id.items() if k in sequence_ids}
        
        # 化简数据
        simplified = processor.simplify_data(entries_by_id)
        
        # 提取序列信息
        sequences = []
        for result in simplified:
            sequences.append({
                "sequence_id": result.sequence_id,
                "reference_name": result.reference_name,
                "target_20_bases": result.target_20_bases,
                "depth": result.depth,
                "percentage": result.percentage,
                "snp_info": result.snp_info
            })
        
        return {
            "success": True,
            "total": len(sequences),
            "sequences": sequences
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"文件不存在")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"序列提取失败: {str(e)}")


@app.get("/api/gene-editing/domains")
async def get_analysis_domains():
    """
    获取支持的分析领域
    """
    from report_generator.data_analyzer import DataAnalyzer
    return {
        "success": True,
        "domains": DataAnalyzer.ANALYSIS_DOMAINS
    }


@app.get("/download")
async def download_file(path: str):
    """
    文件下载API
    
    用于下载生成的文件（如化简后的Excel文件）
    
    参数：
    - path: 文件的完整路径
    
    返回：
    - 文件下载响应
    """
    import os
    
    # 验证文件路径
    if not path:
        raise HTTPException(status_code=400, detail="文件路径不能为空")
    
    # 检查文件是否存在
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"文件不存在: {path}")
    
    # 检查是否是文件（不是目录）
    if not os.path.isfile(path):
        raise HTTPException(status_code=400, detail="路径不是有效的文件")
    
    # 获取文件名
    filename = os.path.basename(path)
    
    # 返回文件下载响应
    return FileResponse(
        path=path,
        filename=filename,
        media_type="application/octet-stream"
    )


# ============================================================================
# 第7部分：程序入口
# ============================================================================
# 
# 【if __name__ == "__main__" 是什么意思？】
# 这是Python的一个常见模式，用于判断当前文件是被直接运行还是被导入。
# - 直接运行（python main.py）：__name__ == "__main__"，执行下面的代码
# - 被导入（import main）：__name__ == "main"，不执行下面的代码
# 
# 这样设计的好处是：
# 1. 可以直接运行此文件启动服务
# 2. 也可以在其他文件中导入此文件的类和函数，而不会自动启动服务
# ============================================================================

if __name__ == "__main__":
    # 导入uvicorn - ASGI服务器，用于运行FastAPI应用
    # ASGI（Asynchronous Server Gateway Interface）是Python异步Web服务器的标准接口
    import uvicorn
    
    # 打印启动信息
    print("=" * 60)
    print("数据分析Agent服务 v2.0")
    print("=" * 60)
    print(f"LLM API: {LLM_API_URL}")
    print(f"LLM Model: {LLM_MODEL}")
    print(f"API Key配置: {'是' if LLM_API_KEY else '否（使用模拟模式）'}")
    print(f"最大迭代次数: {MAX_AGENT_ITERATIONS}")
    print("=" * 60)
    
    # 启动服务
    # host="0.0.0.0": 监听所有网络接口（允许外部访问）
    # port=8000: 监听8000端口
    # 启动后可以通过 http://localhost:8000 访问服务
    # API文档可以通过 http://localhost:8000/docs 访问（FastAPI自动生成）
    uvicorn.run(app, host="0.0.0.0", port=8000)


# ============================================================================
# 恭喜你读完了整个文件！
# ============================================================================
# 
# 【总结】
# 这个文件实现了一个完整的数据分析Agent服务，包括：
# 
# 1. 配置管理：通过环境变量配置LLM API和其他参数
# 2. 数据模型：定义了请求、响应、工具结果等数据结构
# 3. 工具系统：10个数据分析工具，每个工具都有明确的功能
# 4. Agent核心：实现了ReAct循环，协调LLM和工具完成分析
# 5. API接口：提供HTTP接口供前端调用
# 
# 【如何扩展？】
# 1. 添加新工具：继承Tool类，实现execute方法，注册到Agent
# 2. 修改分析流程：调整系统提示词中的工作流程说明
# 3. 支持新的LLM：修改_call_llm方法，适配不同的API格式
# 
# 【学习建议】
# 1. 先理解ReAct循环的核心思想
# 2. 然后学习工具的设计模式
# 3. 最后研究LLM的调用和响应解析
# 
# 祝你学习愉快！🎉
# ============================================================================
