"""
Excel数据处理模块

功能：处理上传的Excel文件，进行特定的数据计算
计算逻辑：
1. y3 = -0.4823 * x1 (B组线性部分)
2. 用x1最后一个点的y3值和y1值计算b值
3. y4 = 0.4557 * x2 + b (E组线性部分)
4. y5 = y1 - y3 (B组非线性部分)
5. y6 = y2 - y4 (E组非线性部分)
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass
from io import BytesIO
import os


@dataclass
class ProcessingResult:
    """处理结果数据类"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    output_file: Optional[bytes] = None


@dataclass
class GroupData:
    """单组数据"""
    x: pd.Series
    y: pd.Series
    name: str


@dataclass
class CalculationParams:
    """计算参数"""
    slope_b: float = -0.4823  # B组斜率
    slope_e: float = 0.4557   # E组斜率


class ExcelDataProcessor:
    """
    Excel数据处理器
    
    处理流程：
    1. 读取Excel文件
    2. 识别数据组（支持多组数据）
    3. 对每组数据进行计算
    4. 生成结果Excel文件
    """
    
    def __init__(self, params: Optional[CalculationParams] = None):
        """
        初始化处理器
        
        参数:
            params: 计算参数，如果不提供则使用默认值
        """
        self.params = params or CalculationParams()
        self.groups: List[Tuple[GroupData, GroupData]] = []  # [(B组, E组), ...]
    
    def read_excel(self, file_path: str = None, file_content: bytes = None) -> ProcessingResult:
        """
        读取Excel文件
        
        参数:
            file_path: 文件路径
            file_content: 文件内容（二进制）
            
        返回:
            ProcessingResult: 处理结果
        """
        try:
            if file_content:
                df = pd.read_excel(BytesIO(file_content), sheet_name=0)
            elif file_path:
                df = pd.read_excel(file_path, sheet_name=0)
            else:
                return ProcessingResult(False, "未提供文件路径或内容")
            
            # 解析数据组
            groups = self._parse_groups(df)
            if not groups:
                return ProcessingResult(False, "未能识别有效的数据组")
            
            self.groups = groups
            self.original_df = df
            
            return ProcessingResult(
                True, 
                f"成功读取文件，识别到 {len(groups)} 组数据",
                {"group_count": len(groups), "columns": df.columns.tolist()}
            )
            
        except Exception as e:
            return ProcessingResult(False, f"读取文件失败: {str(e)}")
    
    def _parse_groups(self, df: pd.DataFrame) -> List[Tuple[GroupData, GroupData]]:
        """
        解析数据组
        
        数据格式：x1, y1, (空列), x2, y2, (空列), x3, y3, ...
        每两列（x, y）为一组数据，B组和E组成对出现
        
        参数:
            df: 原始DataFrame
            
        返回:
            数据组列表，每个元素是(B组, E组)的元组
        """
        groups = []
        columns = df.columns.tolist()
        
        # 找出所有的数据列对 (x, y)
        data_pairs = []
        i = 0
        while i < len(columns):
            col = columns[i]
            # 跳过空列或unnamed列
            if 'unnamed' in str(col).lower() or pd.isna(col):
                i += 1
                continue
            
            # 检查是否是x列
            col_str = str(col).lower()
            if col_str.startswith('x'):
                # 找对应的y列
                x_col = col
                y_col = None
                
                # 查找下一个y列
                for j in range(i + 1, min(i + 3, len(columns))):
                    next_col = str(columns[j]).lower()
                    if next_col.startswith('y'):
                        y_col = columns[j]
                        break
                
                if y_col:
                    # 提取有效数据（去除NaN）
                    x_data = df[x_col].dropna()
                    y_data = df[y_col].dropna()
                    
                    # 取相同长度
                    min_len = min(len(x_data), len(y_data))
                    if min_len > 0:
                        x_data = x_data.iloc[:min_len].reset_index(drop=True)
                        y_data = y_data.iloc[:min_len].reset_index(drop=True)
                        
                        # 转换为数值类型
                        x_data = pd.to_numeric(x_data, errors='coerce')
                        y_data = pd.to_numeric(y_data, errors='coerce')
                        
                        # 再次去除NaN
                        valid_mask = ~(x_data.isna() | y_data.isna())
                        x_data = x_data[valid_mask].reset_index(drop=True)
                        y_data = y_data[valid_mask].reset_index(drop=True)
                        
                        if len(x_data) > 0:
                            group_name = f"Group_{len(data_pairs) + 1}"
                            data_pairs.append(GroupData(x_data, y_data, group_name))
            i += 1
        
        # 将数据对组合成(B组, E组)
        # 假设数据是成对出现的：第1对是B组，第2对是E组
        for i in range(0, len(data_pairs) - 1, 2):
            b_group = data_pairs[i]
            b_group.name = f"B组_{i // 2 + 1}"
            e_group = data_pairs[i + 1]
            e_group.name = f"E组_{i // 2 + 1}"
            groups.append((b_group, e_group))
        
        return groups
    
    def process(self) -> ProcessingResult:
        """
        处理所有数据组
        
        计算逻辑：
        1. 对于B组：y3 = slope_b * x1
        2. 计算b值：b = y1_last - y3_last（使用B组最后一个点）
        3. 对于E组：y4 = slope_e * x2 + b
        4. y5 = y1 - y3（B组非线性部分）
        5. y6 = y2 - y4（E组非线性部分）
        
        返回:
            ProcessingResult: 处理结果
        """
        if not self.groups:
            return ProcessingResult(False, "没有数据可处理，请先读取文件")
        
        results = []
        
        for idx, (b_group, e_group) in enumerate(self.groups):
            try:
                result = self._process_group_pair(b_group, e_group, idx + 1)
                results.append(result)
            except Exception as e:
                return ProcessingResult(False, f"处理第{idx + 1}组数据时出错: {str(e)}")
        
        # 生成输出文件
        output_bytes = self._generate_output(results)
        
        return ProcessingResult(
            True,
            f"成功处理 {len(results)} 组数据",
            {"results": results},
            output_bytes
        )
    
    def _process_group_pair(
        self, 
        b_group: GroupData, 
        e_group: GroupData, 
        group_idx: int
    ) -> Dict[str, Any]:
        """
        处理一对数据组（B组和E组）
        
        参数:
            b_group: B组数据
            e_group: E组数据
            group_idx: 组索引
            
        返回:
            处理结果字典
        """
        # B组计算
        x1 = b_group.x
        y1 = b_group.y
        
        # y3 = slope_b * x1
        y3 = self.params.slope_b * x1
        
        # 计算b值：使用B组最后一个有效点
        # b = y1_last - y3_last
        # 但这里的b是用于E组的，所以需要重新理解需求
        # 根据需求：y3的最后一个点的值带入y4=0.4557*x2+b中算得b值
        # 这意味着：y3_last = 0.4557 * x2_last + b => b = y3_last - 0.4557 * x2_last
        # 但这样不太对，让我重新理解...
        
        # 重新理解需求：
        # 1. 计算y3 = -0.4823 * x1，得到y3的最后一个点值
        # 2. 这个y3_last值作为y4在x2起始点的值，用来计算b
        # 即：y3_last = 0.4557 * x2_first + b => b = y3_last - 0.4557 * x2_first
        
        y3_last = y3.iloc[-1]
        x2_first = e_group.x.iloc[0]
        
        # 计算b值
        b = y3_last - self.params.slope_e * x2_first
        
        # E组计算
        x2 = e_group.x
        y2 = e_group.y
        
        # y4 = slope_e * x2 + b
        y4 = self.params.slope_e * x2 + b
        
        # 计算非线性部分
        y5 = y1 - y3  # B组非线性部分
        y6 = y2 - y4  # E组非线性部分
        
        return {
            "group_index": group_idx,
            "b_value": b,
            "y3_last": y3_last,
            "b_group": {
                "name": b_group.name,
                "x1": x1.tolist(),
                "y1": y1.tolist(),
                "y3": y3.tolist(),
                "y5": y5.tolist(),
                "data_count": len(x1)
            },
            "e_group": {
                "name": e_group.name,
                "x2": x2.tolist(),
                "y2": y2.tolist(),
                "y4": y4.tolist(),
                "y6": y6.tolist(),
                "data_count": len(x2)
            }
        }
    
    def _generate_output(self, results: List[Dict[str, Any]]) -> bytes:
        """
        生成输出Excel文件
        
        参数:
            results: 处理结果列表
            
        返回:
            Excel文件的二进制内容
        """
        output = BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # 为每组数据创建一个sheet
            for result in results:
                group_idx = result["group_index"]
                b_data = result["b_group"]
                e_data = result["e_group"]
                b_value = result["b_value"]
                
                # 创建B组数据DataFrame
                b_df = pd.DataFrame({
                    'x1': b_data['x1'],
                    'y1': b_data['y1'],
                    'y3 (线性部分)': b_data['y3'],
                    'y5 (非线性部分)': b_data['y5']
                })
                
                # 创建E组数据DataFrame
                e_df = pd.DataFrame({
                    'x2': e_data['x2'],
                    'y2': e_data['y2'],
                    'y4 (线性部分)': e_data['y4'],
                    'y6 (非线性部分)': e_data['y6']
                })
                
                # 合并两组数据，用空列分隔
                # 由于两组数据长度可能不同，需要处理
                max_len = max(len(b_df), len(e_df))
                
                # 扩展较短的DataFrame
                if len(b_df) < max_len:
                    b_df = pd.concat([b_df, pd.DataFrame(index=range(len(b_df), max_len))], ignore_index=True)
                if len(e_df) < max_len:
                    e_df = pd.concat([e_df, pd.DataFrame(index=range(len(e_df), max_len))], ignore_index=True)
                
                # 添加空列分隔
                separator = pd.DataFrame({'': [None] * max_len})
                
                # 合并
                combined_df = pd.concat([b_df, separator, e_df], axis=1)
                
                # 写入sheet
                sheet_name = f"组{group_idx}"
                combined_df.to_excel(writer, sheet_name=sheet_name, index=False)
                
                # 获取worksheet添加计算参数信息
                worksheet = writer.sheets[sheet_name]
                
                # 在数据下方添加计算参数
                start_row = max_len + 3
                worksheet.cell(row=start_row, column=1, value="计算参数:")
                worksheet.cell(row=start_row + 1, column=1, value=f"B组斜率: {self.params.slope_b}")
                worksheet.cell(row=start_row + 2, column=1, value=f"E组斜率: {self.params.slope_e}")
                worksheet.cell(row=start_row + 3, column=1, value=f"计算得到的b值: {b_value:.6f}")
                worksheet.cell(row=start_row + 4, column=1, value=f"y3最后一个点值: {result['y3_last']:.6f}")
                
                # 添加公式说明
                worksheet.cell(row=start_row + 6, column=1, value="计算公式:")
                worksheet.cell(row=start_row + 7, column=1, value="y3 = -0.4823 × x1")
                worksheet.cell(row=start_row + 8, column=1, value="y4 = 0.4557 × x2 + b")
                worksheet.cell(row=start_row + 9, column=1, value="y5 = y1 - y3 (B组非线性部分)")
                worksheet.cell(row=start_row + 10, column=1, value="y6 = y2 - y4 (E组非线性部分)")
            
            # 创建汇总sheet
            summary_data = []
            for result in results:
                summary_data.append({
                    '组号': result['group_index'],
                    'B组数据点数': result['b_group']['data_count'],
                    'E组数据点数': result['e_group']['data_count'],
                    'b值': result['b_value'],
                    'y3最后值': result['y3_last']
                })
            
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='汇总', index=False)
        
        output.seek(0)
        return output.getvalue()


def process_excel_file(
    file_path: str = None,
    file_content: bytes = None,
    slope_b: float = -0.4823,
    slope_e: float = 0.4557
) -> ProcessingResult:
    """
    处理Excel文件的便捷函数
    
    参数:
        file_path: 文件路径
        file_content: 文件内容（二进制）
        slope_b: B组斜率，默认-0.4823
        slope_e: E组斜率，默认0.4557
        
    返回:
        ProcessingResult: 处理结果
    """
    params = CalculationParams(slope_b=slope_b, slope_e=slope_e)
    processor = ExcelDataProcessor(params)
    
    # 读取文件
    read_result = processor.read_excel(file_path=file_path, file_content=file_content)
    if not read_result.success:
        return read_result
    
    # 处理数据
    return processor.process()


# 测试代码
if __name__ == "__main__":
    # 测试处理
    result = process_excel_file(file_path="../hb.xlsx")
    print(f"处理结果: {result.success}")
    print(f"消息: {result.message}")
    
    if result.success and result.output_file:
        # 保存输出文件
        with open("../output_test.xlsx", "wb") as f:
            f.write(result.output_file)
        print("输出文件已保存到 output_test.xlsx")
        
        if result.data:
            for r in result.data.get("results", []):
                print(f"\n组{r['group_index']}:")
                print(f"  b值: {r['b_value']:.6f}")
                print(f"  y3最后值: {r['y3_last']:.6f}")
                print(f"  B组数据点数: {r['b_group']['data_count']}")
                print(f"  E组数据点数: {r['e_group']['data_count']}")
