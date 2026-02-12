# AI Agent 系统

## 1. 系统概览

### 1.1 架构设计

本项目采用基于 **LangChain** 的 AI Agent 架构，实现智能数据分析和报告生成功能。

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Agent 系统                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Report Agent│  │ Data Analyzer│  │ Document Generator │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │            │
│         └────────────────┼─────────────────────┘            │
│                          │                                  │
│                   ┌──────▼──────┐                          │
│                   │   LangChain │                          │
│                   │   Framework │                          │
│                   └──────┬──────┘                          │
│                          │                                  │
│         ┌────────────────┼────────────────┐                │
│         ▼                ▼                ▼                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   OpenAI    │  │  通义千问    │  │  其他LLM   │        │
│  │   GPT-4     │  │  Qwen-Max   │  │            │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心组件

| 组件 | 文件 | 职责 |
|------|------|------|
| ReportAgent | `agent.py` | AI代理核心，协调分析和生成 |
| DataAnalyzer | `data_analyzer.py` | 数据分析与洞察提取 |
| ReportGenerator | `report_generator.py` | Word文档生成 |
| PPTGenerator | `ppt_generator.py` | PPT演示文稿生成 |
| Prompts | `prompts.py` | 提示词模板管理 |

---

## 2. LangChain 集成

### 2.1 依赖配置

```python
# 核心依赖
langchain==0.3.14
langchain-openai==0.3.0
langchain-community==0.3.14
openai==1.59.4
```

### 2.2 LLM 初始化

```python
# python_service/report_generator/agent.py
from langchain_openai import ChatOpenAI
from langchain_community.chat_models import ChatTongyi
from langchain.schema import HumanMessage, SystemMessage
import os

class LLMFactory:
    """LLM工厂类，支持多种模型"""
    
    @staticmethod
    def create_llm(provider: str = "openai"):
        """创建LLM实例"""
        
        if provider == "openai":
            return ChatOpenAI(
                model=os.getenv("OPENAI_MODEL", "gpt-4"),
                api_key=os.getenv("OPENAI_API_KEY"),
                base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
                temperature=0.7,
                max_tokens=4096,
            )
        
        elif provider == "qwen":
            return ChatTongyi(
                model=os.getenv("QWEN_MODEL", "qwen-max"),
                api_key=os.getenv("DASHSCOPE_API_KEY"),
                temperature=0.7,
            )
        
        else:
            raise ValueError(f"不支持的LLM提供商: {provider}")
```

### 2.3 Agent 核心实现

```python
# python_service/report_generator/agent.py
from langchain.agents import AgentExecutor, create_structured_chat_agent
from langchain.tools import Tool
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from typing import Dict, Any, Optional
import asyncio

class ReportAgent:
    """AI报告生成代理"""
    
    def __init__(self, llm_provider: str = "openai"):
        self.llm = LLMFactory.create_llm(llm_provider)
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        self.tools = self._create_tools()
        self.agent = self._create_agent()
    
    def _create_tools(self) -> list:
        """创建Agent工具集"""
        
        return [
            Tool(
                name="analyze_data",
                description="分析Excel数据，提取统计信息和洞察",
                func=self._analyze_data_tool,
            ),
            Tool(
                name="generate_summary",
                description="生成数据摘要和关键发现",
                func=self._generate_summary_tool,
            ),
            Tool(
                name="create_chart_description",
                description="为图表生成描述性文本",
                func=self._create_chart_description_tool,
            ),
            Tool(
                name="write_conclusion",
                description="撰写分析结论和建议",
                func=self._write_conclusion_tool,
            ),
        ]
    
    def _create_agent(self) -> AgentExecutor:
        """创建Agent执行器"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        agent = create_structured_chat_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt,
        )
        
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=10,
        )
    
    async def generate_word_report(
        self,
        file_path: str,
        user_id: str,
        options: Dict[str, Any] = None
    ) -> str:
        """生成Word报告"""
        
        from .gene_editing_processor import GeneEditingProcessor
        from .report_generator import WordReportGenerator
        
        # 1. 处理数据
        processor = GeneEditingProcessor(file_path)
        data = processor.load_data()
        analysis = processor.analyze()
        
        # 2. AI生成内容
        ai_content = await self._generate_report_content(analysis, "docx")
        
        # 3. 生成文档
        generator = WordReportGenerator()
        report_path = generator.generate(
            data=data,
            analysis=analysis,
            ai_content=ai_content,
            user_id=user_id,
            options=options or {}
        )
        
        return report_path
    
    async def generate_ppt_report(
        self,
        file_path: str,
        user_id: str,
        options: Dict[str, Any] = None
    ) -> str:
        """生成PPT报告"""
        
        from .gene_editing_processor import GeneEditingProcessor
        from .ppt_generator import PPTGenerator
        
        # 1. 处理数据
        processor = GeneEditingProcessor(file_path)
        data = processor.load_data()
        analysis = processor.analyze()
        
        # 2. AI生成内容
        ai_content = await self._generate_report_content(analysis, "pptx")
        
        # 3. 生成PPT
        generator = PPTGenerator()
        report_path = generator.generate(
            data=data,
            analysis=analysis,
            ai_content=ai_content,
            user_id=user_id,
            options=options or {}
        )
        
        return report_path
    
    async def _generate_report_content(
        self,
        analysis: Dict,
        report_type: str
    ) -> Dict[str, str]:
        """使用AI生成报告内容"""
        
        # 构建分析上下文
        context = self._build_context(analysis)
        
        # 生成各部分内容
        sections = {}
        
        # 1. 执行摘要
        sections['summary'] = await self._invoke_llm(
            SUMMARY_PROMPT.format(context=context)
        )
        
        # 2. 数据分析
        sections['analysis'] = await self._invoke_llm(
            ANALYSIS_PROMPT.format(context=context)
        )
        
        # 3. 结论建议
        sections['conclusion'] = await self._invoke_llm(
            CONCLUSION_PROMPT.format(context=context)
        )
        
        # 4. 图表描述（PPT专用）
        if report_type == "pptx":
            sections['chart_descriptions'] = await self._invoke_llm(
                CHART_PROMPT.format(context=context)
            )
        
        return sections
    
    async def _invoke_llm(self, prompt: str) -> str:
        """调用LLM生成内容"""
        
        messages = [
            SystemMessage(content="你是一位专业的基因编辑数据分析专家。"),
            HumanMessage(content=prompt)
        ]
        
        response = await self.llm.ainvoke(messages)
        return response.content
    
    def _build_context(self, analysis: Dict) -> str:
        """构建分析上下文"""
        
        context_parts = [
            f"样本总数: {analysis.get('total_samples', 'N/A')}",
            f"编辑效率: {analysis.get('editing_efficiency', 'N/A'):.2f}%",
            "\n突变分布:",
        ]
        
        for item in analysis.get('mutation_distribution', []):
            context_parts.append(
                f"  - {item['name']}: {item['count']}个 ({item['percentage']:.1f}%)"
            )
        
        return "\n".join(context_parts)
    
    # ===== 工具函数实现 =====
    
    def _analyze_data_tool(self, query: str) -> str:
        """数据分析工具"""
        return "数据分析完成，详见analysis结果"
    
    def _generate_summary_tool(self, query: str) -> str:
        """摘要生成工具"""
        return "摘要生成完成"
    
    def _create_chart_description_tool(self, query: str) -> str:
        """图表描述工具"""
        return "图表描述已生成"
    
    def _write_conclusion_tool(self, query: str) -> str:
        """结论撰写工具"""
        return "结论已撰写"
```

---

## 3. 提示词工程

### 3.1 提示词模板

```python
# python_service/report_generator/prompts.py

# 系统提示词
SYSTEM_PROMPT = """你是一位专业的基因编辑数据分析师和报告撰写专家。
你的任务是分析基因编辑实验数据并生成专业的分析报告。

你具备以下专业能力：
1. 深入理解CRISPR/Cas9等基因编辑技术
2. 熟练分析突变类型（野生型、杂合突变、纯合突变、嵌合体等）
3. 准确计算编辑效率和成功率
4. 撰写符合学术规范的分析报告

请确保生成的内容：
- 专业准确，使用正确的术语
- 结构清晰，逻辑严密
- 数据支撑，有理有据
- 简洁明了，重点突出
"""

# 摘要生成提示词
SUMMARY_PROMPT = """基于以下基因编辑实验数据，撰写一份专业的执行摘要。

实验数据概况：
{context}

请生成包含以下内容的摘要（200-300字）：
1. 实验概述：样本规模和实验目的
2. 关键发现：主要突变类型和分布
3. 核心指标：编辑效率和成功率
4. 初步结论：实验结果评价

要求：
- 语言专业严谨
- 数据准确引用
- 重点突出关键发现
"""

# 数据分析提示词
ANALYSIS_PROMPT = """请对以下基因编辑实验数据进行详细分析。

实验数据：
{context}

请从以下角度进行分析：

## 1. 突变类型分析
- 各类突变的数量和比例
- 突变类型分布特征
- 与预期结果的对比

## 2. 编辑效率评估
- 总体编辑效率计算
- 不同突变类型的效率对比
- 影响效率的可能因素

## 3. 数据质量评估
- 样本量是否充足
- 数据是否存在异常
- 结果可靠性分析

请确保分析内容专业、数据准确、逻辑清晰。
"""

# 结论建议提示词
CONCLUSION_PROMPT = """基于以下基因编辑实验分析结果，撰写结论和建议。

分析结果：
{context}

请生成以下内容：

## 结论
1. 实验主要发现（3-5点）
2. 编辑效果评价
3. 与同类研究对比（如有参考）

## 建议
1. 后续实验方向
2. 优化建议
3. 注意事项

要求：
- 结论基于数据，有理有据
- 建议具体可行
- 语言专业简洁
"""

# 图表描述提示词
CHART_PROMPT = """为以下基因编辑数据的图表生成描述文字。

数据概况：
{context}

请为以下图表类型生成描述：

1. **饼图：突变类型分布**
   - 描述各突变类型占比
   - 突出主要突变类型

2. **柱状图：样本数量统计**
   - 描述各类样本数量
   - 对比分析

3. **趋势图：编辑效率**
   - 描述效率变化趋势
   - 关键数据点解读

每个描述控制在50-100字，适合PPT展示。
"""

# 幻灯片内容提示词
SLIDE_CONTENT_PROMPTS = {
    "title": """生成PPT标题页内容：
- 主标题：基因编辑实验分析报告
- 副标题：包含日期和样本信息
""",
    
    "overview": """生成实验概述页内容：
数据：{context}
- 3-5个关键要点
- 每点不超过20字
""",
    
    "results": """生成实验结果页内容：
数据：{context}
- 关键数据展示
- 重要发现总结
""",
    
    "conclusion": """生成结论页内容：
数据：{context}
- 3-4点核心结论
- 简洁有力
"""
}
```

### 3.2 提示词最佳实践

```python
class PromptBuilder:
    """提示词构建器"""
    
    @staticmethod
    def build_analysis_prompt(
        data: Dict,
        focus_areas: list = None,
        language: str = "zh"
    ) -> str:
        """构建分析提示词"""
        
        base_prompt = ANALYSIS_PROMPT.format(context=str(data))
        
        # 添加重点关注领域
        if focus_areas:
            focus_section = "\n\n请特别关注以下方面：\n"
            for area in focus_areas:
                focus_section += f"- {area}\n"
            base_prompt += focus_section
        
        # 语言设置
        if language == "en":
            base_prompt = "Please respond in English.\n\n" + base_prompt
        
        return base_prompt
    
    @staticmethod
    def build_few_shot_prompt(
        task: str,
        examples: list,
        query: str
    ) -> str:
        """构建少样本提示词"""
        
        prompt_parts = [f"任务：{task}\n\n示例：\n"]
        
        for i, example in enumerate(examples, 1):
            prompt_parts.append(f"输入{i}: {example['input']}")
            prompt_parts.append(f"输出{i}: {example['output']}\n")
        
        prompt_parts.append(f"\n现在请处理：\n输入: {query}\n输出:")
        
        return "\n".join(prompt_parts)
```

---

## 4. 报告生成器

### 4.1 Word文档生成器

```python
# python_service/report_generator/report_generator.py
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
from typing import Dict, Any
import os
from datetime import datetime
import uuid

class WordReportGenerator:
    """Word报告生成器"""
    
    def __init__(self):
        self.doc = None
        self.styles_configured = False
    
    def generate(
        self,
        data: Any,
        analysis: Dict,
        ai_content: Dict[str, str],
        user_id: str,
        options: Dict = None
    ) -> str:
        """生成Word报告"""
        
        self.doc = Document()
        self._configure_styles()
        
        # 1. 封面页
        self._add_cover_page(analysis, options)
        
        # 2. 目录
        self._add_table_of_contents()
        
        # 3. 执行摘要
        self._add_section("执行摘要", ai_content.get('summary', ''))
        
        # 4. 数据概览
        self._add_data_overview(analysis)
        
        # 5. 详细分析
        self._add_section("详细分析", ai_content.get('analysis', ''))
        
        # 6. 统计图表
        self._add_charts_section(analysis)
        
        # 7. 结论与建议
        self._add_section("结论与建议", ai_content.get('conclusion', ''))
        
        # 8. 附录
        self._add_appendix(data)
        
        # 保存文档
        report_path = self._save_document(user_id)
        return report_path
    
    def _configure_styles(self):
        """配置文档样式"""
        
        if self.styles_configured:
            return
        
        styles = self.doc.styles
        
        # 标题1样式
        h1_style = styles['Heading 1']
        h1_style.font.size = Pt(18)
        h1_style.font.bold = True
        h1_style.font.color.rgb = RGBColor(0, 51, 102)
        
        # 标题2样式
        h2_style = styles['Heading 2']
        h2_style.font.size = Pt(14)
        h2_style.font.bold = True
        h2_style.font.color.rgb = RGBColor(0, 76, 153)
        
        # 正文样式
        normal_style = styles['Normal']
        normal_style.font.size = Pt(11)
        normal_style.font.name = '宋体'
        
        self.styles_configured = True
    
    def _add_cover_page(self, analysis: Dict, options: Dict):
        """添加封面页"""
        
        # 标题
        title = self.doc.add_paragraph()
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = title.add_run("基因编辑实验分析报告")
        run.font.size = Pt(28)
        run.font.bold = True
        
        self.doc.add_paragraph()  # 空行
        
        # 副标题
        subtitle = self.doc.add_paragraph()
        subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = subtitle.add_run(f"样本数量: {analysis.get('total_samples', 'N/A')}")
        run.font.size = Pt(14)
        
        # 日期
        date_para = self.doc.add_paragraph()
        date_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = date_para.add_run(datetime.now().strftime("%Y年%m月%d日"))
        run.font.size = Pt(12)
        
        self.doc.add_page_break()
    
    def _add_table_of_contents(self):
        """添加目录页"""
        
        self.doc.add_heading("目录", level=1)
        
        toc_items = [
            ("1. 执行摘要", 3),
            ("2. 数据概览", 4),
            ("3. 详细分析", 5),
            ("4. 统计图表", 7),
            ("5. 结论与建议", 8),
            ("6. 附录", 9),
        ]
        
        for item, page in toc_items:
            para = self.doc.add_paragraph()
            para.add_run(f"{item}")
            para.add_run("\t" * 8)
            para.add_run(f"{page}")
        
        self.doc.add_page_break()
    
    def _add_section(self, title: str, content: str):
        """添加章节"""
        
        self.doc.add_heading(title, level=1)
        
        # 分段添加内容
        paragraphs = content.split('\n\n')
        for para_text in paragraphs:
            if para_text.strip():
                if para_text.startswith('##'):
                    # 子标题
                    self.doc.add_heading(para_text.replace('##', '').strip(), level=2)
                elif para_text.startswith('-'):
                    # 列表项
                    for line in para_text.split('\n'):
                        if line.strip().startswith('-'):
                            self.doc.add_paragraph(
                                line.strip()[1:].strip(),
                                style='List Bullet'
                            )
                else:
                    self.doc.add_paragraph(para_text.strip())
    
    def _add_data_overview(self, analysis: Dict):
        """添加数据概览"""
        
        self.doc.add_heading("数据概览", level=1)
        
        # 基本统计表格
        table = self.doc.add_table(rows=1, cols=2)
        table.style = 'Table Grid'
        
        # 表头
        header_cells = table.rows[0].cells
        header_cells[0].text = "指标"
        header_cells[1].text = "数值"
        
        # 数据行
        metrics = [
            ("样本总数", str(analysis.get('total_samples', 'N/A'))),
            ("编辑效率", f"{analysis.get('editing_efficiency', 0):.2f}%"),
        ]
        
        for mutation in analysis.get('mutation_distribution', []):
            metrics.append((
                f"{mutation['name']}数量",
                f"{mutation['count']} ({mutation['percentage']:.1f}%)"
            ))
        
        for metric, value in metrics:
            row = table.add_row()
            row.cells[0].text = metric
            row.cells[1].text = value
        
        self.doc.add_paragraph()  # 空行
    
    def _add_charts_section(self, analysis: Dict):
        """添加图表章节"""
        
        self.doc.add_heading("统计图表", level=1)
        
        # 突变分布描述
        self.doc.add_heading("突变类型分布", level=2)
        self.doc.add_paragraph(
            "下图展示了本次实验中各类突变类型的分布情况。"
        )
        
        # 这里可以插入实际生成的图表图片
        # self.doc.add_picture('chart.png', width=Inches(5))
        
        self.doc.add_paragraph("[图表占位符 - 突变分布饼图]")
        
        # 效率分析
        self.doc.add_heading("编辑效率分析", level=2)
        self.doc.add_paragraph(
            f"本次实验的总体编辑效率为 {analysis.get('editing_efficiency', 0):.2f}%。"
        )
    
    def _add_appendix(self, data):
        """添加附录"""
        
        self.doc.add_page_break()
        self.doc.add_heading("附录", level=1)
        
        self.doc.add_heading("A. 数据说明", level=2)
        self.doc.add_paragraph(
            "本报告基于上传的Excel数据文件生成，"
            "数据经过标准化处理后进行分析。"
        )
        
        self.doc.add_heading("B. 术语解释", level=2)
        terms = [
            ("WT (野生型)", "未发生编辑的正常样本"),
            ("HET (杂合突变)", "一个等位基因发生突变"),
            ("HOM (纯合突变)", "两个等位基因均发生突变"),
            ("MOSAIC (嵌合体)", "细胞群体中存在多种基因型"),
        ]
        
        for term, definition in terms:
            para = self.doc.add_paragraph()
            run = para.add_run(f"{term}: ")
            run.bold = True
            para.add_run(definition)
    
    def _save_document(self, user_id: str) -> str:
        """保存文档"""
        
        # 生成文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_id = str(uuid.uuid4())[:8]
        filename = f"report_{file_id}_{timestamp}.docx"
        
        # 确保目录存在
        reports_dir = os.path.join(os.path.dirname(__file__), '..', 'reports')
        os.makedirs(reports_dir, exist_ok=True)
        
        # 保存
        filepath = os.path.join(reports_dir, filename)
        self.doc.save(filepath)
        
        return filepath
```

### 4.2 PPT生成器

```python
# python_service/report_generator/ppt_generator.py
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from typing import Dict, Any, List
import os
from datetime import datetime
import uuid

class PPTGenerator:
    """PPT报告生成器"""
    
    # 配色方案
    COLORS = {
        'primary': RGBColor(0, 112, 192),    # 蓝色
        'secondary': RGBColor(68, 84, 106),  # 深灰
        'accent': RGBColor(0, 176, 80),      # 绿色
        'background': RGBColor(255, 255, 255),
        'text': RGBColor(51, 51, 51),
    }
    
    def __init__(self):
        self.prs = None
    
    def generate(
        self,
        data: Any,
        analysis: Dict,
        ai_content: Dict[str, str],
        user_id: str,
        options: Dict = None
    ) -> str:
        """生成PPT报告"""
        
        self.prs = Presentation()
        self.prs.slide_width = Inches(13.33)  # 16:9
        self.prs.slide_height = Inches(7.5)
        
        # 1. 标题页
        self._add_title_slide(analysis)
        
        # 2. 目录页
        self._add_agenda_slide()
        
        # 3. 实验概述
        self._add_overview_slide(analysis, ai_content)
        
        # 4. 数据统计
        self._add_statistics_slide(analysis)
        
        # 5. 突变分布
        self._add_distribution_slide(analysis)
        
        # 6. 详细分析
        self._add_analysis_slides(ai_content)
        
        # 7. 结论
        self._add_conclusion_slide(ai_content)
        
        # 8. 致谢页
        self._add_thanks_slide()
        
        # 保存
        report_path = self._save_presentation(user_id)
        return report_path
    
    def _add_title_slide(self, analysis: Dict):
        """添加标题页"""
        
        slide_layout = self.prs.slide_layouts[6]  # 空白布局
        slide = self.prs.slides.add_slide(slide_layout)
        
        # 背景色块
        shape = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE,
            Inches(0), Inches(0),
            Inches(13.33), Inches(3)
        )
        shape.fill.solid()
        shape.fill.fore_color.rgb = self.COLORS['primary']
        shape.line.fill.background()
        
        # 主标题
        title_box = slide.shapes.add_textbox(
            Inches(0.5), Inches(1),
            Inches(12), Inches(1.5)
        )
        title_frame = title_box.text_frame
        title_para = title_frame.paragraphs[0]
        title_para.text = "基因编辑实验分析报告"
        title_para.font.size = Pt(44)
        title_para.font.bold = True
        title_para.font.color.rgb = RGBColor(255, 255, 255)
        title_para.alignment = PP_ALIGN.CENTER
        
        # 副标题
        subtitle_box = slide.shapes.add_textbox(
            Inches(0.5), Inches(4),
            Inches(12), Inches(1)
        )
        subtitle_frame = subtitle_box.text_frame
        subtitle_para = subtitle_frame.paragraphs[0]
        subtitle_para.text = f"样本数量: {analysis.get('total_samples', 'N/A')} | "
        subtitle_para.text += datetime.now().strftime("%Y年%m月%d日")
        subtitle_para.font.size = Pt(20)
        subtitle_para.font.color.rgb = self.COLORS['secondary']
        subtitle_para.alignment = PP_ALIGN.CENTER
    
    def _add_agenda_slide(self):
        """添加目录页"""
        
        slide_layout = self.prs.slide_layouts[6]
        slide = self.prs.slides.add_slide(slide_layout)
        
        # 标题
        self._add_slide_title(slide, "目录")
        
        # 目录项
        agenda_items = [
            "01  实验概述",
            "02  数据统计",
            "03  突变分布分析",
            "04  详细分析",
            "05  结论与建议",
        ]
        
        for i, item in enumerate(agenda_items):
            text_box = slide.shapes.add_textbox(
                Inches(2), Inches(2 + i * 0.8),
                Inches(9), Inches(0.6)
            )
            frame = text_box.text_frame
            para = frame.paragraphs[0]
            para.text = item
            para.font.size = Pt(24)
            para.font.color.rgb = self.COLORS['text']
    
    def _add_overview_slide(self, analysis: Dict, ai_content: Dict):
        """添加概述页"""
        
        slide_layout = self.prs.slide_layouts[6]
        slide = self.prs.slides.add_slide(slide_layout)
        
        self._add_slide_title(slide, "实验概述")
        
        # 摘要内容
        summary = ai_content.get('summary', '暂无摘要')
        
        content_box = slide.shapes.add_textbox(
            Inches(0.5), Inches(1.8),
            Inches(12), Inches(5)
        )
        frame = content_box.text_frame
        frame.word_wrap = True
        
        para = frame.paragraphs[0]
        para.text = summary[:500]  # 限制长度
        para.font.size = Pt(18)
        para.font.color.rgb = self.COLORS['text']
        para.line_spacing = 1.5
    
    def _add_statistics_slide(self, analysis: Dict):
        """添加统计页"""
        
        slide_layout = self.prs.slide_layouts[6]
        slide = self.prs.slides.add_slide(slide_layout)
        
        self._add_slide_title(slide, "数据统计")
        
        # 统计卡片
        stats = [
            ("样本总数", str(analysis.get('total_samples', 0)), self.COLORS['primary']),
            ("编辑效率", f"{analysis.get('editing_efficiency', 0):.1f}%", self.COLORS['accent']),
        ]
        
        for i, (label, value, color) in enumerate(stats):
            # 卡片背景
            card = slide.shapes.add_shape(
                MSO_SHAPE.ROUNDED_RECTANGLE,
                Inches(1 + i * 4), Inches(2),
                Inches(3.5), Inches(2.5)
            )
            card.fill.solid()
            card.fill.fore_color.rgb = color
            card.line.fill.background()
            
            # 数值
            value_box = slide.shapes.add_textbox(
                Inches(1 + i * 4), Inches(2.3),
                Inches(3.5), Inches(1.2)
            )
            value_para = value_box.text_frame.paragraphs[0]
            value_para.text = value
            value_para.font.size = Pt(48)
            value_para.font.bold = True
            value_para.font.color.rgb = RGBColor(255, 255, 255)
            value_para.alignment = PP_ALIGN.CENTER
            
            # 标签
            label_box = slide.shapes.add_textbox(
                Inches(1 + i * 4), Inches(3.6),
                Inches(3.5), Inches(0.6)
            )
            label_para = label_box.text_frame.paragraphs[0]
            label_para.text = label
            label_para.font.size = Pt(18)
            label_para.font.color.rgb = RGBColor(255, 255, 255)
            label_para.alignment = PP_ALIGN.CENTER
    
    def _add_distribution_slide(self, analysis: Dict):
        """添加分布页"""
        
        slide_layout = self.prs.slide_layouts[6]
        slide = self.prs.slides.add_slide(slide_layout)
        
        self._add_slide_title(slide, "突变类型分布")
        
        # 分布数据
        distributions = analysis.get('mutation_distribution', [])
        
        # 表格展示
        if distributions:
            rows = len(distributions) + 1
            table = slide.shapes.add_table(rows, 3, Inches(2), Inches(2), Inches(9), Inches(0.5 * rows)).table
            
            # 表头
            table.cell(0, 0).text = "突变类型"
            table.cell(0, 1).text = "数量"
            table.cell(0, 2).text = "占比"
            
            for i, dist in enumerate(distributions, 1):
                table.cell(i, 0).text = dist['name']
                table.cell(i, 1).text = str(dist['count'])
                table.cell(i, 2).text = f"{dist['percentage']:.1f}%"
    
    def _add_analysis_slides(self, ai_content: Dict):
        """添加分析页"""
        
        analysis_text = ai_content.get('analysis', '')
        
        # 将长文本分割成多页
        sections = analysis_text.split('##')
        
        for section in sections[:3]:  # 限制最多3页
            if section.strip():
                slide_layout = self.prs.slide_layouts[6]
                slide = self.prs.slides.add_slide(slide_layout)
                
                # 提取标题和内容
                lines = section.strip().split('\n', 1)
                title = lines[0].strip() if lines else "分析"
                content = lines[1].strip() if len(lines) > 1 else ""
                
                self._add_slide_title(slide, title)
                
                content_box = slide.shapes.add_textbox(
                    Inches(0.5), Inches(1.8),
                    Inches(12), Inches(5)
                )
                frame = content_box.text_frame
                frame.word_wrap = True
                para = frame.paragraphs[0]
                para.text = content[:600]
                para.font.size = Pt(16)
                para.line_spacing = 1.4
    
    def _add_conclusion_slide(self, ai_content: Dict):
        """添加结论页"""
        
        slide_layout = self.prs.slide_layouts[6]
        slide = self.prs.slides.add_slide(slide_layout)
        
        self._add_slide_title(slide, "结论与建议")
        
        conclusion = ai_content.get('conclusion', '暂无结论')
        
        content_box = slide.shapes.add_textbox(
            Inches(0.5), Inches(1.8),
            Inches(12), Inches(5)
        )
        frame = content_box.text_frame
        frame.word_wrap = True
        para = frame.paragraphs[0]
        para.text = conclusion[:500]
        para.font.size = Pt(18)
        para.line_spacing = 1.5
    
    def _add_thanks_slide(self):
        """添加致谢页"""
        
        slide_layout = self.prs.slide_layouts[6]
        slide = self.prs.slides.add_slide(slide_layout)
        
        # 中央大字
        thanks_box = slide.shapes.add_textbox(
            Inches(0), Inches(3),
            Inches(13.33), Inches(1.5)
        )
        frame = thanks_box.text_frame
        para = frame.paragraphs[0]
        para.text = "感谢观看"
        para.font.size = Pt(54)
        para.font.bold = True
        para.font.color.rgb = self.COLORS['primary']
        para.alignment = PP_ALIGN.CENTER
    
    def _add_slide_title(self, slide, title: str):
        """添加页面标题"""
        
        title_box = slide.shapes.add_textbox(
            Inches(0.5), Inches(0.5),
            Inches(12), Inches(1)
        )
        frame = title_box.text_frame
        para = frame.paragraphs[0]
        para.text = title
        para.font.size = Pt(32)
        para.font.bold = True
        para.font.color.rgb = self.COLORS['primary']
    
    def _save_presentation(self, user_id: str) -> str:
        """保存演示文稿"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_id = str(uuid.uuid4())[:8]
        filename = f"report_{file_id}_{timestamp}.pptx"
        
        reports_dir = os.path.join(os.path.dirname(__file__), '..', 'reports')
        os.makedirs(reports_dir, exist_ok=True)
        
        filepath = os.path.join(reports_dir, filename)
        self.prs.save(filepath)
        
        return filepath
```

---

## 5. 配置与环境变量

### 5.1 LLM配置

```bash
# .env 文件

# OpenAI配置
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4

# 通义千问配置（可选）
DASHSCOPE_API_KEY=sk-your-dashscope-key
QWEN_MODEL=qwen-max

# LLM通用配置
LLM_PROVIDER=openai  # openai 或 qwen
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=4096
```

### 5.2 模型选择逻辑

```python
def get_llm_config() -> Dict:
    """获取LLM配置"""
    
    provider = os.getenv("LLM_PROVIDER", "openai")
    
    if provider == "openai":
        return {
            "provider": "openai",
            "model": os.getenv("OPENAI_MODEL", "gpt-4"),
            "api_key": os.getenv("OPENAI_API_KEY"),
            "base_url": os.getenv("OPENAI_BASE_URL"),
        }
    elif provider == "qwen":
        return {
            "provider": "qwen",
            "model": os.getenv("QWEN_MODEL", "qwen-max"),
            "api_key": os.getenv("DASHSCOPE_API_KEY"),
        }
    else:
        raise ValueError(f"未知的LLM提供商: {provider}")
```

---

## 6. 相关文档

| 文档 | 描述 |
|------|------|
| [01-项目概述与架构](./01-项目概述与架构.md) | 项目整体架构 |
| [03-后端服务详解](./03-后端服务详解.md) | Python后端实现 |
| [06-部署与配置](./06-部署与配置.md) | 环境配置与部署 |

---

*文档版本: 1.0.0 | 更新时间: 2026-02-10*
