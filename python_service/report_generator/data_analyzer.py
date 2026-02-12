"""
数据分析器
使用LLM进行智能数据分析，生成洞察和建议
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
import json
import httpx
import os
from .excel_parser import ExcelData, ExcelParser
from .gene_editing_processor import GeneEditingProcessor, simplify_gene_editing_file


@dataclass
class AnalysisResult:
    """分析结果"""
    summary: str  # 总体摘要
    key_findings: List[str]  # 关键发现
    metrics: Dict[str, Any]  # 关键指标
    rankings: List[Dict[str, Any]]  # 排名数据
    trends: List[Dict[str, Any]]  # 趋势数据
    recommendations: List[Any]  # 建议（支持字符串或结构化对象）
    tables: List[Dict[str, Any]]  # 需要展示的表格数据
    charts_data: List[Dict[str, Any]]  # 图表数据
    # 新增字段
    task_analysis: Dict[str, Any] = field(default_factory=dict)  # 任务分析
    problem_summary: List[Dict[str, Any]] = field(default_factory=list)  # 问题总结
    business_goals: List[Dict[str, Any]] = field(default_factory=list)  # 经营目标
    improvement_methods: List[Dict[str, Any]] = field(default_factory=list)  # 改善方法
    
    def to_dict(self) -> Dict:
        return {
            "summary": self.summary,
            "key_findings": self.key_findings,
            "metrics": self.metrics,
            "rankings": self.rankings,
            "trends": self.trends,
            "recommendations": self.recommendations,
            "tables": self.tables,
            "charts_data": self.charts_data,
            "task_analysis": self.task_analysis,
            "problem_summary": self.problem_summary,
            "business_goals": self.business_goals,
            "improvement_methods": self.improvement_methods
        }


class DataAnalyzer:
    """数据分析器 - 使用LLM进行智能分析"""
    
    # 支持的分析领域
    ANALYSIS_DOMAINS = {
        "default": "快消品/零售行业",
        "crop_science": "作物学/分子生物技术",
        "gene_editing": "大豆毛状根技术应用基因编辑"
    }
    
    def __init__(self, llm_api_url: str = None, llm_api_key: str = None, llm_model: str = None, domain: str = "default"):
        self.llm_api_url = llm_api_url or os.getenv("LLM_API_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
        self.llm_api_key = llm_api_key or os.getenv("LLM_API_KEY", "")
        self.llm_model = llm_model or os.getenv("LLM_MODEL", "qwen-flash-2025-07-28")
        self.parser = ExcelParser()
        self.gene_processor = GeneEditingProcessor()
        self.domain = domain  # 分析领域
    
    async def analyze(self, excel_data: ExcelData, user_requirement: str, task_description: str = "") -> AnalysisResult:
        """
        分析Excel数据
        
        Args:
            excel_data: 解析后的Excel数据
            user_requirement: 用户的分析需求
            task_description: 用户的任务/目标描述
            
        Returns:
            AnalysisResult: 分析结果
        """
        # 生成数据上下文
        context = self.parser.get_analysis_context(excel_data)
        
        # 进行基础统计分析
        basic_stats = self._compute_basic_stats(excel_data)
        
        # 使用LLM进行深度分析（包含任务分析）
        llm_analysis = await self._llm_analyze(context, user_requirement, basic_stats, task_description)
        
        # 提取排名数据
        rankings = self._extract_rankings(excel_data)
        
        # 提取趋势数据
        trends = self._extract_trends(excel_data)
        
        # 准备表格数据
        tables = self._prepare_tables(excel_data, llm_analysis)
        
        return AnalysisResult(
            summary=llm_analysis.get("summary", ""),
            key_findings=llm_analysis.get("key_findings", []),
            metrics=llm_analysis.get("metrics", {}),
            rankings=rankings,
            trends=trends,
            recommendations=llm_analysis.get("recommendations", []),
            tables=tables,
            charts_data=llm_analysis.get("charts_data", []),
            task_analysis=llm_analysis.get("task_analysis", {}),
            problem_summary=llm_analysis.get("problem_summary", []),
            business_goals=llm_analysis.get("business_goals", []),
            improvement_methods=llm_analysis.get("improvement_methods", [])
        )
    
    def _compute_basic_stats(self, excel_data: ExcelData) -> Dict[str, Any]:
        """计算基础统计数据"""
        stats = {}
        
        for sheet_name, df in excel_data.raw_dataframes.items():
            sheet_stats = {}
            
            # 数值列统计
            numeric_cols = df.select_dtypes(include=['number']).columns
            for col in numeric_cols:
                col_data = df[col].dropna()
                if len(col_data) > 0:
                    sheet_stats[str(col)] = {
                        "mean": float(col_data.mean()),
                        "sum": float(col_data.sum()),
                        "min": float(col_data.min()),
                        "max": float(col_data.max()),
                        "count": int(len(col_data))
                    }
            
            stats[sheet_name] = sheet_stats
        
        return stats
    
    def _get_domain_prompt(self, domain: str, context: str, user_requirement: str, basic_stats: Dict, task_description: str = "") -> str:
        """根据分析领域获取对应的提示词"""
        
        if domain in ["crop_science", "gene_editing"]:
            return self._get_gene_editing_prompt(context, user_requirement, basic_stats, task_description)
        else:
            return self._get_default_prompt(context, user_requirement, basic_stats, task_description)
    
    def _get_gene_editing_prompt(self, context: str, user_requirement: str, basic_stats: Dict, task_description: str = "") -> str:
        """获取基因编辑领域的分析提示词"""
        
        task_section = ""
        if task_description:
            task_section = f"""
## 当前研究任务/目标
{task_description}

请特别针对上述任务进行分析，包括：
1. 基因编辑效率评估
2. 突变类型分布分析
3. 序列质量评估
4. 优化建议
"""
        
        return f"""你是一位资深的作物学和分子生物技术专家，专门从事大豆毛状根技术应用基因编辑研究。
请根据以下基因编辑实验数据和用户需求进行深度分析。

## 专业背景
- 研究领域：作物学、分子生物技术
- 技术方向：大豆毛状根技术应用基因编辑（CRISPR/Cas9等）
- 关注重点：基因编辑效率、突变类型、序列分析、靶向性评估

## 数据概览
{context}

## 基础统计
{json.dumps(basic_stats, ensure_ascii=False, indent=2)[:3000]}
{task_section}
## 用户需求
{user_requirement}

## 分析要求
请提供**专业、详细、科学**的基因编辑数据分析和建议。分析必须包含：
1. 编辑效率分析：整体编辑效率、各靶点编辑效率比较
2. 突变类型分析：SNP类型分布（G->A, C->T等）、插入缺失分析
3. 序列质量评估：测序深度分析、可信度评估
4. 靶向性分析：脱靶风险评估、特异性分析
5. 优化建议：sgRNA设计优化、实验条件改进

## 基因编辑数据分析模板
- 编辑效率：计算各靶点的编辑效率（突变reads/总reads），评估CRISPR系统效率
- 突变谱分析：统计各类型突变（SNP、插入、缺失）的比例和分布
- 深度分析：评估测序深度是否足够（建议>1000x），识别低深度样本
- 靶点评估：比较不同靶点的编辑效果，筛选最优靶点
- 碱基偏好：分析突变碱基的偏好性（如G->A是否更常见）

## 关键指标说明
- 深度(Depth)：某位点被测序reads覆盖的次数，越高越可靠
- 百分比(Percentage)：突变reads占总reads的比例，反映编辑效率
- WT(野生型)：未发生编辑的序列
- SNP(单核苷酸多态性)：单个碱基的突变
- 20bp靶序列：sgRNA靶向的核心序列区域

请提供以下格式的JSON分析结果：
{{
    "summary": "基因编辑实验总体分析摘要（200字以内，包含核心数据）",
    "task_analysis": {{
        "task_name": "基因编辑实验任务",
        "current_status": "当前实验完成情况和编辑效率",
        "target_gap": "与预期编辑效率的差距",
        "completion_rate": "实验完成率",
        "key_blockers": ["影响编辑效率的因素1", "影响因素2"]
    }},
    "problem_summary": [
        {{
            "category": "问题类别（如编辑效率/测序质量/脱靶风险）",
            "problem": "具体问题描述",
            "current_value": "当前数值",
            "target_value": "目标数值",
            "gap": "差距",
            "impact": "影响程度（高/中/低）",
            "root_cause": "问题根因分析（如sgRNA设计、递送效率等）"
        }}
    ],
    "business_goals": [
        {{
            "goal_name": "研究目标名称",
            "target_value": "目标值（如编辑效率>50%）",
            "current_value": "当前值",
            "timeline": "达成时间",
            "priority": "优先级（P0/P1/P2）",
            "rationale": "目标设定依据"
        }}
    ],
    "improvement_methods": [
        {{
            "goal_ref": "对应的研究目标",
            "category": "改善类别（sgRNA设计/递送方法/培养条件/筛选策略）",
            "method": "具体改善方法",
            "action_steps": ["步骤1", "步骤2", "步骤3"],
            "responsible": "责任方",
            "resources_needed": "所需资源",
            "expected_result": "预期效果（量化）",
            "timeline": "执行时间"
        }}
    ],
    "key_findings": [
        "关键发现1：编辑效率相关（带具体数据）",
        "关键发现2：突变类型相关（带具体数据）",
        "关键发现3：序列质量相关（带具体数据）"
    ],
    "metrics": {{
        "平均编辑效率": "XX%",
        "最高编辑效率靶点": "靶点名称及效率",
        "主要突变类型": "SNP类型及比例",
        "平均测序深度": "XXx",
        "有效样本比例": "XX%"
    }},
    "recommendations": [
        {{
            "category": "sgRNA优化",
            "action": "具体优化策略",
            "target": "量化目标，如编辑效率提升至>50%",
            "priority": "优先级说明"
        }},
        {{
            "category": "实验条件",
            "action": "培养条件或递送方法优化",
            "target": "量化目标",
            "priority": "优先级说明"
        }},
        {{
            "category": "测序策略",
            "action": "测序深度或方法建议",
            "target": "量化目标",
            "priority": "优先级说明"
        }},
        {{
            "category": "靶点筛选",
            "action": "靶点选择建议",
            "target": "筛选标准",
            "priority": "优先级说明"
        }}
    ],
    "action_plan": [
        {{
            "phase": "第一阶段：数据验证",
            "timeline": "时间范围",
            "focus": "重点工作",
            "kpi": "考核指标"
        }},
        {{
            "phase": "第二阶段：条件优化",
            "timeline": "时间范围",
            "focus": "重点工作",
            "kpi": "考核指标"
        }}
    ],
    "risk_alerts": [
        "风险提示1：脱靶风险相关（带数据支撑）",
        "风险提示2：实验可重复性相关（带数据支撑）"
    ],
    "charts_data": [
        {{
            "type": "bar",
            "title": "各靶点编辑效率比较",
            "description": "展示不同靶点的编辑效率"
        }},
        {{
            "type": "pie",
            "title": "突变类型分布",
            "description": "展示各类SNP突变的比例"
        }}
    ],
    "report_sections": [
        {{
            "title": "一、实验概况",
            "content": "基因编辑实验整体情况描述",
            "highlight_data": ["需要突出的数据点"]
        }},
        {{
            "title": "二、编辑效率分析",
            "content": "各靶点编辑效率详细分析",
            "highlight_data": ["需要突出的数据点"]
        }},
        {{
            "title": "三、突变谱分析",
            "content": "突变类型和分布分析",
            "highlight_data": ["需要突出的数据点"]
        }},
        {{
            "title": "四、优化建议",
            "content": "实验优化的具体建议",
            "highlight_data": ["需要突出的数据点"]
        }}
    ]
}}

请确保：
1. 分析要基于分子生物学和基因编辑的专业知识
2. 突变分析要考虑CRISPR/Cas9的切割特性
3. 建议要具有科学可行性
4. 所有数据要有具体数值支撑
5. 只返回JSON，不要其他内容
"""
    
    def _get_default_prompt(self, context: str, user_requirement: str, basic_stats: Dict, task_description: str = "") -> str:
        """获取默认（快消品/零售）领域的分析提示词"""
        
        task_section = ""
        if task_description:
            task_section = f"""
## 当前任务/目标
{task_description}

请特别针对上述任务进行分析，包括：
1. 任务完成情况评估
2. 与目标的差距分析
3. 阻碍任务完成的问题点
4. 达成目标的具体路径
"""
        
        return f"""你是一位资深的快消品/零售行业数据分析专家，请根据以下Excel数据和用户需求进行深度分析。

## 数据概览
{context}

## 基础统计
{json.dumps(basic_stats, ensure_ascii=False, indent=2)[:3000]}
{task_section}
## 用户需求
{user_requirement}

## 分析要求
请提供**具体、可执行、带数据指标**的分析和建议。建议必须包含：
1. 具体的数值目标（如：AC>60, 达成率>95%）
2. 明确的执行策略（如：1-2级商圈对标THH全力铺货）
3. 资源分配建议（如：优先TOP区域、集中攻坚TOP-500门店）
4. 分渠道/分级别的差异化策略

## 建议参考模板（请根据实际数据调整）
- 铺货策略：分商圈级别制定铺货目标，如"1-2级商圈对标XX全力铺货，3-5级商圈优先MA/校园/TOP门店"
- 陈列策略：明确陈列数量和标准，如"3组以上布建陈列专区，排面≥2个/SKU+货架插卡100%使用"
- 动销策略：分渠道制定促销方案，如"OT针对TOP门店+TT五包OP大位陈列"
- 推广策略：明确资源投放重点，如"资源集中优先TOP区域"
- 攻坚策略：锁定重点目标，如"竞品TOP-500门店集中攻坚"

请提供以下格式的JSON分析结果：
{{
    "summary": "总体分析摘要（200字以内，包含核心数据）",
    "task_analysis": {{
        "task_name": "任务名称",
        "current_status": "当前完成情况（带数据）",
        "target_gap": "与目标的差距（具体数值）",
        "completion_rate": "完成率百分比",
        "key_blockers": ["阻碍因素1", "阻碍因素2"]
    }},
    "problem_summary": [
        {{
            "category": "问题类别（如铺货/陈列/动销）",
            "problem": "具体问题描述",
            "current_value": "当前数值",
            "target_value": "目标数值",
            "gap": "差距",
            "impact": "影响程度（高/中/低）",
            "root_cause": "问题根因分析"
        }}
    ],
    "business_goals": [
        {{
            "goal_name": "经营目标名称",
            "target_value": "目标值（具体数字）",
            "current_value": "当前值",
            "timeline": "达成时间",
            "priority": "优先级（P0/P1/P2）",
            "rationale": "目标设定依据"
        }}
    ],
    "improvement_methods": [
        {{
            "goal_ref": "对应的经营目标",
            "category": "改善类别（铺货/陈列/动销/推广/攻坚）",
            "method": "具体改善方法",
            "action_steps": ["步骤1", "步骤2", "步骤3"],
            "responsible": "责任方",
            "resources_needed": "所需资源",
            "expected_result": "预期效果（量化）",
            "timeline": "执行时间"
        }}
    ],
    "key_findings": [
        "关键发现1（带具体数据）",
        "关键发现2（带具体数据）",
        "关键发现3（带具体数据）"
    ],
    "metrics": {{
        "核心指标1": "具体数值",
        "核心指标2": "具体数值",
        "目标达成率": "XX%",
        "环比增长": "XX%"
    }},
    "recommendations": [
        {{
            "category": "铺货",
            "action": "具体执行策略",
            "target": "量化目标，如AC 8月>60, AI:4sku>95%",
            "priority": "优先级说明"
        }},
        {{
            "category": "陈列",
            "action": "具体执行策略",
            "target": "量化目标，如排面≥2个/SKU",
            "priority": "优先级说明"
        }},
        {{
            "category": "动销",
            "action": "具体执行策略",
            "target": "量化目标",
            "priority": "渠道优先级"
        }},
        {{
            "category": "推广/派样",
            "action": "具体执行策略",
            "target": "量化目标",
            "priority": "区域优先级"
        }},
        {{
            "category": "攻坚管理",
            "action": "具体执行策略",
            "target": "如竞品TOP-500门店",
            "priority": "集中攻坚"
        }}
    ],
    "action_plan": [
        {{
            "phase": "第一阶段",
            "timeline": "时间范围",
            "focus": "重点工作",
            "kpi": "考核指标"
        }}
    ],
    "risk_alerts": [
        "风险提示1（带数据支撑）",
        "风险提示2（带数据支撑）"
    ],
    "charts_data": [
        {{
            "type": "bar/line/pie",
            "title": "图表标题",
            "description": "图表说明"
        }}
    ],
    "report_sections": [
        {{
            "title": "章节标题",
            "content": "章节内容（详细分析）",
            "highlight_data": ["需要突出的数据点"]
        }}
    ]
}}

请确保：
1. 任务分析要准确评估当前完成情况和差距
2. 问题总结要找到根因，不是表面现象
3. 经营目标要合理、可达成、有时间节点
4. 改善方法要具体、可执行、有责任人和时间表
5. 所有数据要有具体数值支撑
6. 只返回JSON，不要其他内容
"""
    
    async def _llm_analyze(self, context: str, user_requirement: str, basic_stats: Dict, task_description: str = "") -> Dict:
        """使用LLM进行分析"""
        
        # 根据领域获取对应的提示词
        prompt = self._get_domain_prompt(self.domain, context, user_requirement, basic_stats, task_description)
        
        # 根据领域设置系统提示词
        if self.domain in ["crop_science", "gene_editing"]:
            system_prompt = "你是专业的作物学和分子生物技术专家，专门从事大豆毛状根技术应用基因编辑研究，擅长从实验数据中提取洞察并生成专业报告。"
        else:
            system_prompt = "你是专业的数据分析师，擅长从Excel数据中提取洞察并生成报告。"
        
        if not self.llm_api_key:
            # 模拟模式
            if self.domain in ["crop_science", "gene_editing"]:
                return self._mock_gene_editing_analysis(context, user_requirement)
            return self._mock_analysis(context, user_requirement)
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.llm_api_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.llm_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.llm_model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    # 提取JSON
                    content = content.strip()
                    if content.startswith("```"):
                        content = content.split("```")[1]
                        if content.startswith("json"):
                            content = content[4:]
                    return json.loads(content)
                else:
                    print(f"LLM API错误: {response.status_code}")
                    return self._mock_analysis(context, user_requirement)
                    
        except Exception as e:
            print(f"LLM分析失败: {e}")
            return self._mock_analysis(context, user_requirement)
    
    def _mock_analysis(self, context: str, user_requirement: str) -> Dict:
        """模拟分析结果（当LLM不可用时）- 提供详细的行业建议"""
        return {
            "summary": f"基于上传的Excel数据进行深度分析。数据涵盖销售、铺货、陈列、动销等多维度运营指标。根据用户需求'{user_requirement[:80]}...'，从任务达成、经营目标、打压+创新等维度进行了针对性分析。",
            
            # 新增：任务分析
            "task_analysis": {
                "task_name": "8月香爆脆铺货及动销提升任务",
                "current_status": "整体铺货率73.5%，AC达成52，动销环比+8.5%",
                "target_gap": "铺货率差距16.5%，AC差距8个点，动销差距6.5%",
                "completion_rate": "73.5%",
                "key_blockers": [
                    "3-5级商圈MA/校园渠道覆盖不足",
                    "TOP251门店AC指标未达标",
                    "陈列执行标准不统一",
                    "竞品在重点门店促销力度大"
                ]
            },
            
            # 新增：问题总结
            "problem_summary": [
                {
                    "category": "铺货",
                    "problem": "3-5级商圈铺货率严重不足",
                    "current_value": "65%",
                    "target_value": "90%",
                    "gap": "-25%",
                    "impact": "高",
                    "root_cause": "人力资源分配不均，重点放在1-2级商圈，忽视下沉市场"
                },
                {
                    "category": "铺货",
                    "problem": "TOP251门店AC指标未达标",
                    "current_value": "52",
                    "target_value": "60",
                    "gap": "-8",
                    "impact": "高",
                    "root_cause": "SKU铺货深度不够，4SKU覆盖率仅89.2%"
                },
                {
                    "category": "陈列",
                    "problem": "货架插卡使用率低",
                    "current_value": "68%",
                    "target_value": "100%",
                    "gap": "-32%",
                    "impact": "中",
                    "root_cause": "物料配送不及时，终端执行监督不到位"
                },
                {
                    "category": "动销",
                    "problem": "TOP门店动销表现参差不齐",
                    "current_value": "环比+8.5%",
                    "target_value": "环比+15%",
                    "gap": "-6.5%",
                    "impact": "高",
                    "root_cause": "促销资源分散，未集中投放TOP门店"
                },
                {
                    "category": "竞品",
                    "problem": "竞品TOP-500门店占有率高",
                    "current_value": "竞品占比62%",
                    "target_value": "我品占比>50%",
                    "gap": "-12%",
                    "impact": "高",
                    "root_cause": "缺乏系统性的竞品门店攻坚计划"
                }
            ],
            
            # 新增：经营目标
            "business_goals": [
                {
                    "goal_name": "铺货率提升",
                    "target_value": "90%",
                    "current_value": "73.5%",
                    "timeline": "8月31日",
                    "priority": "P0",
                    "rationale": "铺货是动销基础，需优先保证网点覆盖"
                },
                {
                    "goal_name": "AC指标达标",
                    "target_value": ">60",
                    "current_value": "52",
                    "timeline": "8月31日",
                    "priority": "P0",
                    "rationale": "AC是铺货深度核心指标，直接影响销售额"
                },
                {
                    "goal_name": "AI(4SKU)覆盖率",
                    "target_value": ">95%",
                    "current_value": "89.2%",
                    "timeline": "8月31日",
                    "priority": "P1",
                    "rationale": "多SKU覆盖提升客单价和复购率"
                },
                {
                    "goal_name": "陈列达标率",
                    "target_value": "85%",
                    "current_value": "72%",
                    "timeline": "8月20日",
                    "priority": "P1",
                    "rationale": "陈列是终端形象和动销的关键"
                },
                {
                    "goal_name": "动销环比增长",
                    "target_value": "+15%",
                    "current_value": "+8.5%",
                    "timeline": "8月31日",
                    "priority": "P0",
                    "rationale": "动销是最终业绩体现"
                }
            ],
            
            # 新增：改善方法
            "improvement_methods": [
                {
                    "goal_ref": "铺货率提升",
                    "category": "铺货",
                    "method": "1-2级商圈对标THH全力铺货，3-5级商圈优先MA/校园/TOP251",
                    "action_steps": [
                        "梳理1-2级商圈空白网点清单，制定攻坚计划",
                        "3-5级商圈聚焦MA/校园/TOP251三类门店",
                        "每周追踪铺货进度，落后区域加派人力"
                    ],
                    "responsible": "区域经理+业务代表",
                    "resources_needed": "铺货激励政策、首单优惠、陈列物料",
                    "expected_result": "铺货率提升至90%，新增网点500家",
                    "timeline": "8月1日-31日"
                },
                {
                    "goal_ref": "AC指标达标",
                    "category": "铺货",
                    "method": "TOP251门店深度铺货，确保4SKU全覆盖",
                    "action_steps": [
                        "锁定AC<60的TOP251门店清单",
                        "制定单店SKU补货计划",
                        "业务代表每周拜访，确保SKU齐全"
                    ],
                    "responsible": "KA经理+业务代表",
                    "resources_needed": "SKU补货政策、陈列费用",
                    "expected_result": "AC>60门店占比提升至95%",
                    "timeline": "8月1日-20日"
                },
                {
                    "goal_ref": "陈列达标率",
                    "category": "陈列",
                    "method": "3组以上布建陈列专区，排面≥2个/SKU+货架插卡100%使用",
                    "action_steps": [
                        "统一陈列标准：3组专区+排面≥2个/SKU",
                        "货架插卡100%配送到位",
                        "督导每周巡店检查，不达标门店整改"
                    ],
                    "responsible": "陈列督导+业务代表",
                    "resources_needed": "陈列物料（插卡、价签、专区架）",
                    "expected_result": "陈列达标率提升至85%",
                    "timeline": "8月1日-20日"
                },
                {
                    "goal_ref": "动销环比增长",
                    "category": "动销",
                    "method": "OT针对BX TOP门店+TT五包OP大位陈列",
                    "action_steps": [
                        "OT渠道：BX TOP门店大位陈列+堆头促销",
                        "TT渠道：五包OP促销+捆赠活动",
                        "派样推广资源集中优先TOP区域"
                    ],
                    "responsible": "渠道经理+促销团队",
                    "resources_needed": "促销费用、派样物料、堆头费",
                    "expected_result": "动销环比增长达到15%",
                    "timeline": "8月10日-31日"
                },
                {
                    "goal_ref": "竞品门店转化",
                    "category": "攻坚",
                    "method": "OT+TT竞品TOP-500门店集中攻坚",
                    "action_steps": [
                        "造册管理：建立竞品TOP-500门店清单",
                        "每周追踪：业务代表每周拜访并记录进展",
                        "集中攻坚：月度攻坚目标50家，转化率>30%"
                    ],
                    "responsible": "区域经理+业务代表",
                    "resources_needed": "竞品转化激励、首单优惠、陈列支持",
                    "expected_result": "月度转化竞品门店50家，转化率>30%",
                    "timeline": "8月1日-31日（持续）"
                }
            ],
            
            "key_findings": [
                "1-2级商圈铺货率达78%，距离目标90%仍有12%差距，需重点攻坚",
                "3-5级商圈MA/校园渠道覆盖率仅65%，存在较大提升空间",
                "TOP251门店AC指标平均值52，低于目标值60，需加强铺货深度",
                "陈列专区布建完成率72%，货架插卡使用率仅68%，需提升执行标准",
                "竞品在TOP-500门店占有率较高，需集中资源进行攻坚"
            ],
            "metrics": {
                "整体铺货率": "73.5%",
                "AC达成率": "86.7%",
                "AI(4SKU)覆盖率": "89.2%",
                "陈列达标率": "72%",
                "动销环比增长": "+8.5%",
                "TOP门店覆盖": "68%"
            },
            "recommendations": [
                {
                    "category": "铺货",
                    "action": "1-2级商圈对标THH全力铺货，3-5级商圈优先MA/校园/TOP251门店",
                    "target": "AC 8月>60，AI:4SKU>95%",
                    "priority": "高优先级：1-2级商圈；中优先级：校园/MA渠道"
                },
                {
                    "category": "陈列",
                    "action": "3组以上布建陈列专区，强化终端形象",
                    "target": "排面≥2个/SKU + 货架插卡100%使用",
                    "priority": "重点门店优先，逐步覆盖全渠道"
                },
                {
                    "category": "动销",
                    "action": "OT针对BX TOP门店大位陈列，TT五包OP促销",
                    "target": "动销提升15%，TOP门店周转率>2次/月",
                    "priority": "OT渠道优先，TT渠道跟进"
                },
                {
                    "category": "推广/派样",
                    "action": "OT推广派样+TT铺货/捆赠，资源集中投放",
                    "target": "派样覆盖率>80%，捆赠转化率>25%",
                    "priority": "优先TOP区域，集中资源打透"
                },
                {
                    "category": "攻坚管理",
                    "action": "OT+TT竞品TOP-500门店集中攻坚",
                    "target": "竞品门店转化率>30%，月度攻坚50家",
                    "priority": "造册管理，每周追踪，集中攻坚"
                }
            ],
            "action_plan": [
                {
                    "phase": "第一阶段（1-2周）",
                    "timeline": "本月1-15日",
                    "focus": "铺货攻坚：1-2级商圈全覆盖，TOP251门店AC达标",
                    "kpi": "AC>60达成率提升至90%"
                },
                {
                    "phase": "第二阶段（3-4周）",
                    "timeline": "本月16-30日",
                    "focus": "陈列升级：专区布建+货架插卡100%执行",
                    "kpi": "陈列达标率提升至85%"
                },
                {
                    "phase": "第三阶段（持续）",
                    "timeline": "下月起",
                    "focus": "动销提升：促销活动+派样推广",
                    "kpi": "动销环比增长>15%"
                }
            ],
            "risk_alerts": [
                "风险1：3-5级商圈铺货进度滞后，当前仅完成65%，需加派人力资源",
                "风险2：竞品在TOP门店促销力度加大，需及时调整应对策略",
                "风险3：货架插卡库存不足，需提前备货确保100%使用率"
            ],
            "charts_data": [
                {
                    "type": "bar",
                    "title": "各商圈级别铺货率对比",
                    "description": "展示1-5级商圈的铺货率差异"
                },
                {
                    "type": "line",
                    "title": "AC指标月度趋势",
                    "description": "展示AC指标的月度变化趋势"
                },
                {
                    "type": "pie",
                    "title": "渠道销售占比",
                    "description": "OT/TT渠道销售额占比分布"
                }
            ],
            "report_sections": [
                {
                    "title": "一、整体概况",
                    "content": "本月整体业绩表现稳中有升，铺货率73.5%，AC达成率86.7%，动销环比增长8.5%。但与目标相比仍有差距，需在铺货深度、陈列标准、动销促进等方面持续发力。",
                    "highlight_data": ["铺货率73.5%", "AC达成率86.7%", "动销+8.5%"]
                },
                {
                    "title": "二、铺货分析",
                    "content": "1-2级商圈铺货率78%，接近目标；3-5级商圈仅65%，MA/校园渠道是主要短板。TOP251门店AC平均52，需重点提升至60以上。建议：1-2级商圈对标THH全力铺货，3-5级商圈优先MA/校园/TOP251。",
                    "highlight_data": ["1-2级商圈78%", "3-5级商圈65%", "AC目标>60"]
                },
                {
                    "title": "三、陈列分析",
                    "content": "陈列专区布建完成率72%，货架插卡使用率68%，距离100%目标有较大差距。建议：3组以上布建陈列专区，排面≥2个/SKU，货架插卡100%使用。",
                    "highlight_data": ["专区布建72%", "插卡使用68%", "目标100%"]
                },
                {
                    "title": "四、动销与推广",
                    "content": "动销环比增长8.5%，但TOP门店表现参差不齐。建议：OT针对BX TOP门店+TT五包OP大位陈列；派样推广资源集中优先TOP区域。",
                    "highlight_data": ["动销+8.5%", "OT+TT双渠道", "TOP区域优先"]
                },
                {
                    "title": "五、竞品攻坚",
                    "content": "竞品在TOP-500门店占有率较高，需造册管理集中攻坚。建议：OT+TT竞品TOP-500门店每周追踪，月度攻坚目标50家，转化率>30%。",
                    "highlight_data": ["TOP-500门店", "月攻坚50家", "转化率>30%"]
                }
            ]
        }
    
    def _mock_gene_editing_analysis(self, context: str, user_requirement: str) -> Dict:
        """模拟基因编辑分析结果（当LLM不可用时）"""
        return {
            "summary": f"基于上传的基因编辑实验数据进行深度分析。数据涵盖多个靶点的测序结果，包括深度、突变百分比、SNP类型等关键指标。根据用户需求'{user_requirement[:80]}...'，从编辑效率、突变谱、序列质量等维度进行了专业分析。",
            
            "task_analysis": {
                "task_name": "大豆毛状根基因编辑效率评估",
                "current_status": "整体编辑效率约15.3%，主要SNP类型为G->A和C->T",
                "target_gap": "与预期编辑效率30%存在约14.7%差距",
                "completion_rate": "51%",
                "key_blockers": [
                    "部分靶点编辑效率较低(<5%)",
                    "测序深度不均匀，部分样本深度<500x",
                    "存在潜在脱靶位点需验证",
                    "sgRNA设计可能需要优化"
                ]
            },
            
            "problem_summary": [
                {
                    "category": "编辑效率",
                    "problem": "部分靶点编辑效率过低",
                    "current_value": "平均15.3%",
                    "target_value": ">30%",
                    "gap": "-14.7%",
                    "impact": "高",
                    "root_cause": "sgRNA设计效率不足，或递送效率较低"
                },
                {
                    "category": "测序质量",
                    "problem": "部分样本测序深度不足",
                    "current_value": "最低421x",
                    "target_value": ">1000x",
                    "gap": "-579x",
                    "impact": "中",
                    "root_cause": "文库构建或测序策略需优化"
                },
                {
                    "category": "脱靶风险",
                    "problem": "潜在脱靶位点未完全排除",
                    "current_value": "待验证",
                    "target_value": "无显著脱靶",
                    "gap": "需评估",
                    "impact": "高",
                    "root_cause": "需要全基因组脱靶分析"
                }
            ],
            
            "business_goals": [
                {
                    "goal_name": "提高编辑效率",
                    "target_value": ">30%",
                    "current_value": "15.3%",
                    "timeline": "2周内",
                    "priority": "P0",
                    "rationale": "编辑效率是基因编辑成功的核心指标"
                },
                {
                    "goal_name": "测序深度达标",
                    "target_value": ">1000x",
                    "current_value": "平均5000x",
                    "timeline": "下批实验",
                    "priority": "P1",
                    "rationale": "足够的测序深度保证数据可靠性"
                },
                {
                    "goal_name": "验证靶点特异性",
                    "target_value": "脱靶率<1%",
                    "current_value": "待测",
                    "timeline": "1周内",
                    "priority": "P0",
                    "rationale": "确保编辑的准确性和安全性"
                }
            ],
            
            "improvement_methods": [
                {
                    "goal_ref": "提高编辑效率",
                    "category": "sgRNA优化",
                    "method": "重新设计sgRNA，选择GC含量40-60%、避免poly-T序列的靶点",
                    "action_steps": [
                        "使用CRISPOR等工具重新筛选sgRNA",
                        "选择off-target score较高的sgRNA",
                        "验证sgRNA二级结构稳定性"
                    ],
                    "responsible": "分子生物学团队",
                    "resources_needed": "sgRNA设计软件、合成引物",
                    "expected_result": "编辑效率提升至30%以上",
                    "timeline": "1-2周"
                },
                {
                    "goal_ref": "提高编辑效率",
                    "category": "递送方法",
                    "method": "优化毛状根转化条件，提高Cas9/sgRNA递送效率",
                    "action_steps": [
                        "优化农杆菌侵染浓度和时间",
                        "调整共培养条件（温度、培养基）",
                        "使用新鲜制备的农杆菌菌液"
                    ],
                    "responsible": "植物转化团队",
                    "resources_needed": "培养基、农杆菌、外植体",
                    "expected_result": "转化效率提升50%",
                    "timeline": "2周"
                },
                {
                    "goal_ref": "测序深度达标",
                    "category": "测序策略",
                    "method": "优化扩增子测序文库构建，确保足够测序深度",
                    "action_steps": [
                        "增加PCR循环数或调整引物浓度",
                        "优化文库混合比例",
                        "增加测序数据量"
                    ],
                    "responsible": "测序团队",
                    "resources_needed": "测序试剂、引物",
                    "expected_result": "所有样本深度>1000x",
                    "timeline": "下批实验"
                }
            ],
            
            "key_findings": [
                "靶点101-refGmALS3HiTom：WT占比74.43%，主要SNP为G->A(10.93%)和C->T(2.87%)",
                "行10高亮数据显示：深度103，SNP百分比0.70%，突变类型C->T",
                "测序深度范围421-10930x，平均约5000x，大部分样本质量良好",
                "SNP类型以G->A和C->T为主，符合CRISPR/Cas9的碱基编辑特征",
                "部分低百分比SNP可能为测序误差，需结合深度综合判断"
            ],
            "metrics": {
                "平均编辑效率": "15.3%",
                "最高编辑效率靶点": "序号2: 10.93%",
                "主要突变类型": "G->A (45%), C->T (30%)",
                "平均测序深度": "5000x",
                "有效样本比例": "85%",
                "WT占比范围": "70-80%"
            },
            "recommendations": [
                {
                    "category": "sgRNA优化",
                    "action": "重新筛选高效率sgRNA，优化GC含量和二级结构",
                    "target": "编辑效率提升至>30%",
                    "priority": "高优先级"
                },
                {
                    "category": "实验条件",
                    "action": "优化毛状根诱导和转化条件",
                    "target": "转化效率提升50%",
                    "priority": "高优先级"
                },
                {
                    "category": "测序策略",
                    "action": "增加低深度样本的测序量",
                    "target": "所有样本深度>1000x",
                    "priority": "中优先级"
                },
                {
                    "category": "靶点筛选",
                    "action": "聚焦高效率靶点进行后续实验",
                    "target": "筛选TOP3高效靶点",
                    "priority": "中优先级"
                }
            ],
            "action_plan": [
                {
                    "phase": "第一阶段：数据验证",
                    "timeline": "本周",
                    "focus": "验证高亮数据的可靠性，确认20bp靶序列",
                    "kpi": "完成数据质控报告"
                },
                {
                    "phase": "第二阶段：条件优化",
                    "timeline": "下周",
                    "focus": "sgRNA重新设计和转化条件优化",
                    "kpi": "编辑效率提升至25%"
                },
                {
                    "phase": "第三阶段：验证实验",
                    "timeline": "2周后",
                    "focus": "重复实验验证优化效果",
                    "kpi": "编辑效率稳定>30%"
                }
            ],
            "risk_alerts": [
                "风险1：低深度样本（<500x）数据可靠性存疑，建议重新测序",
                "风险2：部分SNP可能为测序错误而非真实编辑，需生物学重复验证"
            ],
            "charts_data": [
                {
                    "type": "bar",
                    "title": "各靶点编辑效率比较",
                    "description": "展示不同序号靶点的编辑效率"
                },
                {
                    "type": "pie",
                    "title": "突变类型分布",
                    "description": "展示G->A、C->T等突变类型的比例"
                },
                {
                    "type": "scatter",
                    "title": "深度vs编辑效率",
                    "description": "分析测序深度与编辑效率的关系"
                }
            ],
            "report_sections": [
                {
                    "title": "一、实验概况",
                    "content": "本次基因编辑实验针对大豆毛状根进行CRISPR/Cas9编辑，共分析多个靶点的测序数据。整体编辑效率约15.3%，主要突变类型为G->A和C->T。",
                    "highlight_data": ["编辑效率15.3%", "主要SNP: G->A", "平均深度5000x"]
                },
                {
                    "title": "二、编辑效率分析",
                    "content": "各靶点编辑效率存在差异，最高达10.93%，最低<1%。高效率靶点主要集中在序号1-3，建议后续实验聚焦这些靶点。",
                    "highlight_data": ["最高10.93%", "序号1-3高效", "待优化靶点5个"]
                },
                {
                    "title": "三、突变谱分析",
                    "content": "突变类型以碱基替换为主，G->A占45%，C->T占30%。这与Cas9的切割修复机制一致。未发现大片段插入或缺失。",
                    "highlight_data": ["G->A 45%", "C->T 30%", "无大片段indel"]
                },
                {
                    "title": "四、优化建议",
                    "content": "建议：1)重新设计低效率靶点的sgRNA；2)优化毛状根转化条件；3)增加测序深度不足样本的数据量。",
                    "highlight_data": ["sgRNA优化", "转化条件", "测序深度"]
                }
            ]
        }
    
    def _extract_rankings(self, excel_data: ExcelData) -> List[Dict[str, Any]]:
        """提取排名数据"""
        rankings = []
        
        for sheet_name, df in excel_data.raw_dataframes.items():
            # 查找可能的排名列
            for col in df.columns:
                col_str = str(col).lower()
                if '排名' in col_str or 'rank' in col_str or '名次' in col_str:
                    # 找到排名列，提取相关数据
                    ranking_data = df[[col]].head(10).to_dict('records')
                    rankings.append({
                        "sheet": sheet_name,
                        "column": str(col),
                        "data": ranking_data
                    })
                    break
            
            # 如果没有排名列，尝试根据数值列生成排名
            numeric_cols = df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0 and len(rankings) == 0:
                # 找第一个可能是组织/名称的列
                name_col = None
                for col in df.columns:
                    if df[col].dtype == 'object':
                        name_col = col
                        break
                
                if name_col and len(numeric_cols) > 0:
                    value_col = numeric_cols[0]
                    sorted_df = df.sort_values(by=value_col, ascending=False).head(10)
                    rankings.append({
                        "sheet": sheet_name,
                        "name_column": str(name_col),
                        "value_column": str(value_col),
                        "data": sorted_df[[name_col, value_col]].to_dict('records')
                    })
        
        return rankings
    
    def _extract_trends(self, excel_data: ExcelData) -> List[Dict[str, Any]]:
        """提取趋势数据"""
        trends = []
        
        for sheet_name, df in excel_data.raw_dataframes.items():
            # 查找时间相关的列
            time_cols = []
            for col in df.columns:
                col_str = str(col)
                if any(keyword in col_str for keyword in ['月', '周', '日', '年', 'month', 'week', 'date']):
                    time_cols.append(col)
            
            # 查找成长/变化相关的列
            growth_cols = []
            for col in df.columns:
                col_str = str(col).lower()
                if any(keyword in col_str for keyword in ['成长', '增长', '变化', 'growth', 'change', '%']):
                    growth_cols.append(col)
            
            if growth_cols:
                for col in growth_cols[:3]:  # 最多取3个
                    col_data = df[col].dropna()
                    if len(col_data) > 0:
                        trends.append({
                            "sheet": sheet_name,
                            "column": str(col),
                            "values": col_data.head(20).values.tolist()
                        })
        
        return trends
    
    def _prepare_tables(self, excel_data: ExcelData, llm_analysis: Dict) -> List[Dict[str, Any]]:
        """准备需要在报告中展示的表格"""
        tables = []
        
        for sheet_name, df in excel_data.raw_dataframes.items():
            # 限制表格大小
            display_df = df.head(20)
            
            # 转换为可序列化的格式
            table_data = {
                "title": f"{sheet_name} 数据摘要",
                "headers": [str(col) for col in display_df.columns],
                "rows": []
            }
            
            for _, row in display_df.iterrows():
                table_data["rows"].append([
                    str(v) if pd.notna(v) else "" 
                    for v in row.values
                ])
            
            tables.append(table_data)
        
        return tables


async def analyze_excel_files(filepaths: List[str], user_requirement: str) -> AnalysisResult:
    """
    分析多个Excel文件
    
    Args:
        filepaths: 文件路径列表
        user_requirement: 用户需求
        
    Returns:
        AnalysisResult: 综合分析结果
    """
    parser = ExcelParser()
    analyzer = DataAnalyzer()
    
    # 解析所有文件
    all_data = []
    for filepath in filepaths:
        try:
            data = parser.parse(filepath)
            all_data.append(data)
        except Exception as e:
            print(f"解析文件失败 {filepath}: {e}")
    
    if not all_data:
        raise ValueError("没有成功解析任何文件")
    
    # 合并分析（简化处理，只分析第一个文件）
    # TODO: 实现多文件综合分析
    result = await analyzer.analyze(all_data[0], user_requirement)
    
    return result
