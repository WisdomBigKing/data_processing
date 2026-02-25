"""
报告生成模块测试脚本
"""

import asyncio
import os
import sys

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from report_generator import ExcelParser, DataAnalyzer, ReportGeneratorAgent, get_agent

# 测试文件路径
TEST_FILES = [
    r"c:\Users\宇宙无敌智慧大将军\Desktop\test\data_processing\project\香爆脆本月目标进度.xlsx",
    r"c:\Users\宇宙无敌智慧大将军\Desktop\test\data_processing\project\真味道&好汤面.xlsx",
]


def test_excel_parser():
    """测试Excel解析器"""
    print("=" * 60)
    print("测试 Excel 解析器")
    print("=" * 60)
    
    parser = ExcelParser()
    
    for filepath in TEST_FILES:
        if os.path.exists(filepath):
            print(f"\n解析文件: {os.path.basename(filepath)}")
            try:
                data = parser.parse(filepath)
                print(f"  - 文件名: {data.filename}")
                print(f"  - 工作表数量: {data.sheet_count}")
                for sheet_name, sheet_info in data.sheets.items():
                    print(f"  - 工作表 '{sheet_name}': {sheet_info.row_count}行 x {sheet_info.col_count}列")
                    print(f"    列名: {sheet_info.headers[:5]}...")
                print("  ✅ 解析成功")
            except Exception as e:
                print(f"  ❌ 解析失败: {e}")
        else:
            print(f"文件不存在: {filepath}")


async def test_data_analyzer():
    """测试数据分析器"""
    print("\n" + "=" * 60)
    print("测试 数据分析器")
    print("=" * 60)
    
    parser = ExcelParser()
    analyzer = DataAnalyzer()
    
    filepath = TEST_FILES[0]
    if not os.path.exists(filepath):
        print(f"测试文件不存在: {filepath}")
        return
    
    print(f"\n分析文件: {os.path.basename(filepath)}")
    
    try:
        # 解析Excel
        excel_data = parser.parse(filepath)
        
        # 分析数据
        result = await analyzer.analyze(
            excel_data,
            "分析各区域的销售业绩，找出表现最好和最差的区域，并给出改进建议"
        )
        
        print(f"\n分析结果:")
        print(f"  - 摘要: {result.summary[:100]}...")
        print(f"  - 关键发现数量: {len(result.key_findings)}")
        print(f"  - 建议数量: {len(result.recommendations)}")
        print(f"  - 表格数量: {len(result.tables)}")
        print("  ✅ 分析成功")
    except Exception as e:
        print(f"  ❌ 分析失败: {e}")
        import traceback
        traceback.print_exc()


async def test_report_generator():
    """测试完整的报告生成流程"""
    print("\n" + "=" * 60)
    print("测试 报告生成器")
    print("=" * 60)
    
    filepath = TEST_FILES[0]
    if not os.path.exists(filepath):
        print(f"测试文件不存在: {filepath}")
        return
    
    # 创建输出目录
    output_dir = os.path.join(os.path.dirname(__file__), "test_reports")
    os.makedirs(output_dir, exist_ok=True)
    
    agent = ReportGeneratorAgent(output_dir=output_dir)
    
    print(f"\n生成Word报告...")
    try:
        # 创建任务
        task = agent.create_task(
            user_id="test_user",
            excel_files=[filepath],
            user_requirement="分析香爆脆产品的销售目标完成情况，按区域和营业所进行排名，找出表现优秀和需要改进的区域",
            report_title="香爆脆销售分析报告",
            output_format="word"
        )
        
        print(f"  - 任务ID: {task.task_id}")
        print(f"  - 状态: {task.status.value}")
        
        # 处理任务
        await agent.process_task(task.task_id)
        
        print(f"  - 最终状态: {task.status.value}")
        print(f"  - 输出文件: {task.output_path}")
        
        if task.output_path and os.path.exists(task.output_path):
            print("  ✅ Word报告生成成功")
        else:
            print("  ❌ Word报告生成失败")
    except Exception as e:
        print(f"  ❌ 报告生成失败: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"\n生成PPT报告...")
    try:
        # 创建PPT任务
        task2 = agent.create_task(
            user_id="test_user",
            excel_files=[filepath],
            user_requirement="生成香爆脆产品月度经营检视PPT",
            report_title="香爆脆月度经营检视",
            output_format="ppt"
        )
        
        print(f"  - 任务ID: {task2.task_id}")
        
        # 处理任务
        await agent.process_task(task2.task_id)
        
        print(f"  - 最终状态: {task2.status.value}")
        print(f"  - 输出文件: {task2.output_path}")
        
        if task2.output_path and os.path.exists(task2.output_path):
            print("  ✅ PPT报告生成成功")
        else:
            print("  ❌ PPT报告生成失败")
    except Exception as e:
        print(f"  ❌ PPT报告生成失败: {e}")
        import traceback
        traceback.print_exc()


async def main():
    """运行所有测试"""
    print("\n" + "=" * 60)
    print("报告生成模块测试")
    print("=" * 60)
    
    # 测试Excel解析
    test_excel_parser()
    
    # 测试数据分析
    await test_data_analyzer()
    
    # 测试报告生成
    await test_report_generator()
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
