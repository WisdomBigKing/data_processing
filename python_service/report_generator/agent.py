"""
报告生成Agent
整合Excel解析、数据分析、报告生成的完整流程
"""

import os
import uuid
import asyncio
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from .excel_parser import ExcelParser, ExcelData
from .data_analyzer import DataAnalyzer, AnalysisResult
from .report_builder import (
    ReportBuilder, WordReportBuilder, PPTReportBuilder,
    ReportConfig, create_report
)


class TaskStatus(str, Enum):
    """任务状态"""
    PENDING = "pending"
    PARSING = "parsing"
    ANALYZING = "analyzing"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ReportTask:
    """报告生成任务"""
    task_id: str
    user_id: str
    status: TaskStatus
    excel_files: List[str]
    user_requirement: str
    report_title: str
    output_format: str  # word 或 ppt
    created_at: datetime
    updated_at: datetime
    task_description: str = ""  # 新增：任务描述
    progress: int = 0
    progress_message: str = ""
    excel_data: List[ExcelData] = field(default_factory=list)
    analysis_result: Optional[AnalysisResult] = None
    output_path: Optional[str] = None
    error_message: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "task_id": self.task_id,
            "user_id": self.user_id,
            "status": self.status.value,
            "excel_files": self.excel_files,
            "user_requirement": self.user_requirement,
            "task_description": self.task_description,
            "report_title": self.report_title,
            "output_format": self.output_format,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "progress": self.progress,
            "progress_message": self.progress_message,
            "output_path": self.output_path,
            "error_message": self.error_message
        }


class ReportGeneratorAgent:
    """报告生成Agent"""
    
    def __init__(self, output_dir: str = "./reports"):
        self.output_dir = output_dir
        self.parser = ExcelParser()
        self.analyzer = DataAnalyzer()
        self.tasks: Dict[str, ReportTask] = {}
        
        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)
    
    def create_task(
        self,
        user_id: str,
        excel_files: List[str],
        user_requirement: str,
        report_title: str = "数据分析报告",
        output_format: str = "word",
        task_description: str = ""
    ) -> ReportTask:
        """
        创建报告生成任务
        
        Args:
            user_id: 用户ID
            excel_files: Excel文件路径列表
            user_requirement: 用户分析需求
            report_title: 报告标题
            output_format: 输出格式 (word/ppt)
            task_description: 任务/目标描述
            
        Returns:
            ReportTask: 创建的任务
        """
        task_id = str(uuid.uuid4())
        now = datetime.now()
        
        task = ReportTask(
            task_id=task_id,
            user_id=user_id,
            status=TaskStatus.PENDING,
            excel_files=excel_files,
            user_requirement=user_requirement,
            task_description=task_description,
            report_title=report_title,
            output_format=output_format,
            created_at=now,
            updated_at=now,
            progress=0,
            progress_message="任务已创建，等待处理"
        )
        
        self.tasks[task_id] = task
        return task
    
    def get_task(self, task_id: str) -> Optional[ReportTask]:
        """获取任务"""
        return self.tasks.get(task_id)
    
    def get_user_tasks(self, user_id: str) -> List[ReportTask]:
        """获取用户的所有任务"""
        return [t for t in self.tasks.values() if t.user_id == user_id]
    
    async def process_task(self, task_id: str) -> ReportTask:
        """
        处理报告生成任务
        
        Args:
            task_id: 任务ID
            
        Returns:
            ReportTask: 处理后的任务
        """
        task = self.tasks.get(task_id)
        if not task:
            raise ValueError(f"任务不存在: {task_id}")
        
        try:
            # 阶段1: 解析Excel文件
            await self._parse_excel_files(task)
            
            # 阶段2: 分析数据
            await self._analyze_data(task)
            
            # 阶段3: 生成报告
            await self._generate_report(task)
            
            # 完成
            task.status = TaskStatus.COMPLETED
            task.progress = 100
            task.progress_message = "报告生成完成"
            task.updated_at = datetime.now()
            
        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error_message = str(e)
            task.progress_message = f"处理失败: {str(e)}"
            task.updated_at = datetime.now()
            raise
        
        return task
    
    async def _parse_excel_files(self, task: ReportTask):
        """解析Excel文件"""
        task.status = TaskStatus.PARSING
        task.progress = 10
        task.progress_message = "正在解析Excel文件..."
        task.updated_at = datetime.now()
        
        excel_data_list = []
        total_files = len(task.excel_files)
        
        for i, filepath in enumerate(task.excel_files):
            task.progress_message = f"正在解析文件 ({i+1}/{total_files}): {os.path.basename(filepath)}"
            task.progress = 10 + int(20 * (i + 1) / total_files)
            task.updated_at = datetime.now()
            
            try:
                data = self.parser.parse(filepath)
                excel_data_list.append(data)
            except Exception as e:
                raise ValueError(f"解析文件失败 {filepath}: {str(e)}")
        
        task.excel_data = excel_data_list
        task.progress = 30
        task.progress_message = f"已解析 {len(excel_data_list)} 个文件"
    
    async def _analyze_data(self, task: ReportTask):
        """分析数据"""
        task.status = TaskStatus.ANALYZING
        task.progress = 35
        task.progress_message = "正在分析数据..."
        task.updated_at = datetime.now()
        
        if not task.excel_data:
            raise ValueError("没有可分析的数据")
        
        # 合并所有Excel数据的上下文
        combined_context = []
        for data in task.excel_data:
            context = self.parser.get_analysis_context(data)
            combined_context.append(context)
        
        # 分析第一个文件（主要数据源）
        # TODO: 支持多文件综合分析
        task.progress = 50
        task.progress_message = "正在进行智能分析..."
        
        result = await self.analyzer.analyze(
            task.excel_data[0],
            task.user_requirement,
            task.task_description
        )
        
        task.analysis_result = result
        task.progress = 70
        task.progress_message = "数据分析完成"
    
    async def _generate_report(self, task: ReportTask):
        """生成报告"""
        task.status = TaskStatus.GENERATING
        task.progress = 75
        task.progress_message = "正在生成报告..."
        task.updated_at = datetime.now()
        
        if not task.analysis_result:
            raise ValueError("没有分析结果")
        
        # 配置报告
        config = ReportConfig(
            title=task.report_title,
            subtitle=task.user_requirement[:50] + "..." if len(task.user_requirement) > 50 else task.user_requirement,
            output_format=task.output_format
        )
        
        # 生成输出文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = "pptx" if task.output_format == "ppt" else "docx"
        filename = f"report_{task.task_id[:8]}_{timestamp}.{ext}"
        output_path = os.path.join(self.output_dir, filename)
        
        task.progress = 85
        task.progress_message = f"正在生成{task.output_format.upper()}报告..."
        
        # 生成报告
        result_path = create_report(
            task.analysis_result,
            output_path,
            config,
            task.output_format
        )
        
        task.output_path = result_path
        task.progress = 95
        task.progress_message = "报告生成完成，正在保存..."


# 全局Agent实例
_agent_instance: Optional[ReportGeneratorAgent] = None


def get_agent(output_dir: str = "./reports") -> ReportGeneratorAgent:
    """获取Agent单例"""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = ReportGeneratorAgent(output_dir)
    return _agent_instance


async def generate_report(
    user_id: str,
    excel_files: List[str],
    user_requirement: str,
    report_title: str = "数据分析报告",
    output_format: str = "word"
) -> Dict[str, Any]:
    """
    生成报告的便捷函数
    
    Args:
        user_id: 用户ID
        excel_files: Excel文件路径列表
        user_requirement: 用户分析需求
        report_title: 报告标题
        output_format: 输出格式 (word/ppt)
        
    Returns:
        Dict: 包含任务信息和结果
    """
    agent = get_agent()
    
    # 创建任务
    task = agent.create_task(
        user_id=user_id,
        excel_files=excel_files,
        user_requirement=user_requirement,
        report_title=report_title,
        output_format=output_format
    )
    
    # 处理任务
    try:
        await agent.process_task(task.task_id)
        return {
            "success": True,
            "task": task.to_dict(),
            "output_path": task.output_path
        }
    except Exception as e:
        return {
            "success": False,
            "task": task.to_dict(),
            "error": str(e)
        }
