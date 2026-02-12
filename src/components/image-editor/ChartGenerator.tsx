"use client";

import React, { useState, useCallback } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/store/editor-store";
import {
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";

type ChartType = "bar" | "pie" | "line" | "area";

// 数据系列（用于多列对比）
interface DataSeries {
  name: string;
  color: string;
  values: number[];
}

// 类别标签
interface ChartData {
  categories: string[]; // X轴类别标签，如 ["一", "二", "三"]
  series: DataSeries[]; // 多个数据系列
}

const defaultColors = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
];

// 默认多列数据
const defaultChartData: ChartData = {
  categories: ["一", "二", "三", "四", "五"],
  series: [
    { name: "系列A", color: defaultColors[0], values: [65, 45, 80, 55, 90] },
    { name: "系列B", color: defaultColors[1], values: [45, 60, 50, 70, 65] },
  ],
};

export const ChartGenerator: React.FC = () => {
  const { canvas, addToHistory, updateLayers } = useEditorStore();
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [chartData, setChartData] = useState<ChartData>(defaultChartData);
  const [chartWidth, setChartWidth] = useState(400);
  const [chartHeight, setChartHeight] = useState(300);
  const [showLegend, setShowLegend] = useState(true);
  const [showValues, setShowValues] = useState(true);
  const [title, setTitle] = useState("数据图表");

  // 添加类别
  const addCategory = () => {
    setChartData({
      ...chartData,
      categories: [
        ...chartData.categories,
        `类别${chartData.categories.length + 1}`,
      ],
      series: chartData.series.map((s) => ({
        ...s,
        values: [...s.values, 50],
      })),
    });
  };

  // 删除类别
  const removeCategory = (index: number) => {
    if (chartData.categories.length > 2) {
      setChartData({
        ...chartData,
        categories: chartData.categories.filter((_, i) => i !== index),
        series: chartData.series.map((s) => ({
          ...s,
          values: s.values.filter((_, i) => i !== index),
        })),
      });
    }
  };

  // 添加数据系列
  const addSeries = () => {
    const newColor =
      defaultColors[chartData.series.length % defaultColors.length];
    setChartData({
      ...chartData,
      series: [
        ...chartData.series,
        {
          name: `系列${String.fromCharCode(65 + chartData.series.length)}`,
          color: newColor,
          values: chartData.categories.map(() => 50),
        },
      ],
    });
  };

  // 删除数据系列
  const removeSeries = (index: number) => {
    if (chartData.series.length > 1) {
      setChartData({
        ...chartData,
        series: chartData.series.filter((_, i) => i !== index),
      });
    }
  };

  // 更新类别名称
  const updateCategory = (index: number, value: string) => {
    const newCategories = [...chartData.categories];
    newCategories[index] = value;
    setChartData({ ...chartData, categories: newCategories });
  };

  // 更新系列属性
  const updateSeries = (
    seriesIndex: number,
    field: "name" | "color",
    value: string,
  ) => {
    const newSeries = [...chartData.series];
    newSeries[seriesIndex] = { ...newSeries[seriesIndex], [field]: value };
    setChartData({ ...chartData, series: newSeries });
  };

  // 更新数据值
  const updateValue = (
    seriesIndex: number,
    categoryIndex: number,
    value: number,
  ) => {
    const newSeries = [...chartData.series];
    const newValues = [...newSeries[seriesIndex].values];
    newValues[categoryIndex] = value;
    newSeries[seriesIndex] = { ...newSeries[seriesIndex], values: newValues };
    setChartData({ ...chartData, series: newSeries });
  };

  const createBarChart = useCallback(() => {
    if (!canvas) return;

    const objects: fabric.Object[] = [];
    const allValues = chartData.series.flatMap((s) => s.values);
    const maxValue = Math.max(...allValues);
    const numCategories = chartData.categories.length;
    const numSeries = chartData.series.length;
    const chartAreaHeight = chartHeight - 80; // 留出图例空间
    const chartAreaWidth = chartWidth - 70;
    const startX = 50;
    const startY = chartHeight - 60;

    // 计算每组柱子的宽度
    const groupWidth = chartAreaWidth / numCategories;
    const barWidth = (groupWidth - 10) / numSeries;

    // 背景
    const bg = new fabric.Rect({
      left: 0,
      top: 0,
      width: chartWidth,
      height: chartHeight,
      fill: "#FFFFFF",
      stroke: "#E5E7EB",
      strokeWidth: 1,
      rx: 8,
      ry: 8,
    });
    objects.push(bg);

    // 标题
    const titleText = new fabric.Text(title, {
      left: chartWidth / 2,
      top: 15,
      fontSize: 16,
      fontWeight: "bold",
      fill: "#1F2937",
      originX: "center",
    });
    objects.push(titleText);

    // Y轴
    const yAxis = new fabric.Line([startX, 40, startX, startY], {
      stroke: "#9CA3AF",
      strokeWidth: 1,
    });
    objects.push(yAxis);

    // X轴
    const xAxis = new fabric.Line([startX, startY, chartWidth - 20, startY], {
      stroke: "#9CA3AF",
      strokeWidth: 1,
    });
    objects.push(xAxis);

    // 网格线和Y轴标签
    for (let i = 0; i <= 5; i++) {
      const y = startY - (chartAreaHeight / 5) * i;
      const gridLine = new fabric.Line([startX, y, chartWidth - 20, y], {
        stroke: "#E5E7EB",
        strokeWidth: 0.5,
        strokeDashArray: [3, 3],
      });
      objects.push(gridLine);

      const label = new fabric.Text(String(Math.round((maxValue / 5) * i)), {
        left: startX - 5,
        top: y,
        fontSize: 10,
        fill: "#6B7280",
        originX: "right",
        originY: "center",
      });
      objects.push(label);
    }

    // 绘制分组柱形图
    chartData.categories.forEach((category, catIndex) => {
      const groupX = startX + 5 + catIndex * groupWidth;

      // 绘制每个系列的柱子
      chartData.series.forEach((series, serIndex) => {
        const value = series.values[catIndex];
        const barHeight = (value / maxValue) * chartAreaHeight;
        const x = groupX + serIndex * barWidth;
        const y = startY - barHeight;

        // 柱形
        const bar = new fabric.Rect({
          left: x,
          top: y,
          width: barWidth - 2,
          height: barHeight,
          fill: series.color,
          rx: 2,
          ry: 2,
        });
        objects.push(bar);

        // 数值标签
        if (showValues) {
          const valueLabel = new fabric.Text(String(value), {
            left: x + (barWidth - 2) / 2,
            top: y - 3,
            fontSize: 9,
            fill: "#374151",
            originX: "center",
            originY: "bottom",
          });
          objects.push(valueLabel);
        }
      });

      // X轴类别标签
      const xLabel = new fabric.Text(category, {
        left: groupX + (groupWidth - 10) / 2,
        top: startY + 5,
        fontSize: 10,
        fill: "#6B7280",
        originX: "center",
      });
      objects.push(xLabel);
    });

    // 图例
    if (showLegend) {
      const legendY = chartHeight - 25;
      const legendItemWidth = chartWidth / chartData.series.length;

      chartData.series.forEach((series, i) => {
        const x = 20 + i * legendItemWidth;

        const colorBox = new fabric.Rect({
          left: x,
          top: legendY,
          width: 12,
          height: 12,
          fill: series.color,
          rx: 2,
          ry: 2,
        });
        objects.push(colorBox);

        const legendLabel = new fabric.Text(series.name, {
          left: x + 16,
          top: legendY + 6,
          fontSize: 10,
          fill: "#6B7280",
          originY: "center",
        });
        objects.push(legendLabel);
      });
    }

    // 创建组
    const group = new fabric.Group(objects, {
      left: 100,
      top: 100,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (group as any).id = `chart-${Date.now()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (group as any).chartType = "bar";

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    updateLayers();
    addToHistory(JSON.stringify(canvas.toJSON()));
  }, [
    canvas,
    chartData,
    chartWidth,
    chartHeight,
    title,
    showValues,
    showLegend,
    addToHistory,
    updateLayers,
  ]);

  const createPieChart = useCallback(() => {
    if (!canvas) return;

    const objects: fabric.Object[] = [];
    // 饼图使用第一个系列的数据
    const pieData = chartData.categories.map((cat, i) => ({
      label: cat,
      value: chartData.series[0].values[i],
      color: defaultColors[i % defaultColors.length],
    }));
    const total = pieData.reduce((sum, d) => sum + d.value, 0);
    const centerX = chartWidth / 2;
    const centerY = chartHeight / 2 + 10;
    const radius = Math.min(chartWidth, chartHeight) / 2 - 60;

    // 背景
    const bg = new fabric.Rect({
      left: 0,
      top: 0,
      width: chartWidth,
      height: chartHeight,
      fill: "#FFFFFF",
      stroke: "#E5E7EB",
      strokeWidth: 1,
      rx: 8,
      ry: 8,
    });
    objects.push(bg);

    // 标题
    const titleText = new fabric.Text(title, {
      left: chartWidth / 2,
      top: 15,
      fontSize: 16,
      fontWeight: "bold",
      fill: "#1F2937",
      originX: "center",
    });
    objects.push(titleText);

    // 绘制扇形
    let startAngle = -90;
    pieData.forEach((d) => {
      const sliceAngle = (d.value / total) * 360;
      const endAngle = startAngle + sliceAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;
      const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      const slice = new fabric.Path(pathData, {
        fill: d.color,
        stroke: "#FFFFFF",
        strokeWidth: 2,
      });
      objects.push(slice);

      const midAngle = (((startAngle + endAngle) / 2) * Math.PI) / 180;
      const labelRadius = radius * 0.7;
      const labelX = centerX + labelRadius * Math.cos(midAngle);
      const labelY = centerY + labelRadius * Math.sin(midAngle);

      if (showValues && sliceAngle > 15) {
        const percent = Math.round((d.value / total) * 100);
        const valueLabel = new fabric.Text(`${percent}%`, {
          left: labelX,
          top: labelY,
          fontSize: 11,
          fill: "#FFFFFF",
          fontWeight: "bold",
          originX: "center",
          originY: "center",
        });
        objects.push(valueLabel);
      }

      startAngle = endAngle;
    });

    // 图例
    if (showLegend) {
      const legendStartY = chartHeight - 30;
      const legendItemWidth = chartWidth / pieData.length;

      pieData.forEach((d, i) => {
        const x = 20 + i * legendItemWidth;

        const colorBox = new fabric.Rect({
          left: x,
          top: legendStartY,
          width: 12,
          height: 12,
          fill: d.color,
          rx: 2,
          ry: 2,
        });
        objects.push(colorBox);

        const legendLabel = new fabric.Text(d.label, {
          left: x + 16,
          top: legendStartY + 6,
          fontSize: 10,
          fill: "#6B7280",
          originY: "center",
        });
        objects.push(legendLabel);
      });
    }

    const group = new fabric.Group(objects, {
      left: 100,
      top: 100,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (group as any).id = `chart-${Date.now()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (group as any).chartType = "pie";

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    updateLayers();
    addToHistory(JSON.stringify(canvas.toJSON()));
  }, [
    canvas,
    chartData,
    chartWidth,
    chartHeight,
    title,
    showValues,
    showLegend,
    addToHistory,
    updateLayers,
  ]);

  const createLineChart = useCallback(() => {
    if (!canvas) return;

    const objects: fabric.Object[] = [];
    const allValues = chartData.series.flatMap((s) => s.values);
    const maxValue = Math.max(...allValues);
    const chartAreaWidth = chartWidth - 70;
    const chartAreaHeight = chartHeight - 80;
    const startX = 50;
    const startY = chartHeight - 60;

    // 背景
    const bg = new fabric.Rect({
      left: 0,
      top: 0,
      width: chartWidth,
      height: chartHeight,
      fill: "#FFFFFF",
      stroke: "#E5E7EB",
      strokeWidth: 1,
      rx: 8,
      ry: 8,
    });
    objects.push(bg);

    // 标题
    const titleText = new fabric.Text(title, {
      left: chartWidth / 2,
      top: 15,
      fontSize: 16,
      fontWeight: "bold",
      fill: "#1F2937",
      originX: "center",
    });
    objects.push(titleText);

    // 坐标轴
    const yAxis = new fabric.Line([startX, 40, startX, startY], {
      stroke: "#9CA3AF",
      strokeWidth: 1,
    });
    objects.push(yAxis);

    const xAxis = new fabric.Line([startX, startY, chartWidth - 20, startY], {
      stroke: "#9CA3AF",
      strokeWidth: 1,
    });
    objects.push(xAxis);

    // 网格线
    for (let i = 0; i <= 5; i++) {
      const y = startY - (chartAreaHeight / 5) * i;
      const gridLine = new fabric.Line([startX, y, chartWidth - 20, y], {
        stroke: "#E5E7EB",
        strokeWidth: 0.5,
        strokeDashArray: [3, 3],
      });
      objects.push(gridLine);

      const label = new fabric.Text(String(Math.round((maxValue / 5) * i)), {
        left: startX - 5,
        top: y,
        fontSize: 10,
        fill: "#6B7280",
        originX: "right",
        originY: "center",
      });
      objects.push(label);
    }

    // 为每个系列绘制折线
    chartData.series.forEach((series) => {
      const points: { x: number; y: number }[] = series.values.map((v, i) => ({
        x:
          startX +
          20 +
          (chartAreaWidth / (chartData.categories.length - 1)) * i,
        y: startY - (v / maxValue) * chartAreaHeight,
      }));

      // 区域填充（如果是面积图）
      if (chartType === "area") {
        const areaPath =
          `M ${points[0].x} ${startY} ` +
          points.map((p) => `L ${p.x} ${p.y}`).join(" ") +
          ` L ${points[points.length - 1].x} ${startY} Z`;

        const area = new fabric.Path(areaPath, {
          fill: `${series.color}33`,
          stroke: "transparent",
        });
        objects.push(area);
      }

      // 折线
      const linePathData = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");
      const line = new fabric.Path(linePathData, {
        fill: "transparent",
        stroke: series.color,
        strokeWidth: 2,
      });
      objects.push(line);

      // 数据点
      points.forEach((p, i) => {
        const point = new fabric.Circle({
          left: p.x,
          top: p.y,
          radius: 4,
          fill: "#FFFFFF",
          stroke: series.color,
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        });
        objects.push(point);

        if (showValues) {
          const valueLabel = new fabric.Text(String(series.values[i]), {
            left: p.x,
            top: p.y - 12,
            fontSize: 9,
            fill: "#374151",
            originX: "center",
          });
          objects.push(valueLabel);
        }
      });
    });

    // X轴类别标签
    chartData.categories.forEach((cat, i) => {
      const x =
        startX + 20 + (chartAreaWidth / (chartData.categories.length - 1)) * i;
      const xLabel = new fabric.Text(cat, {
        left: x,
        top: startY + 5,
        fontSize: 10,
        fill: "#6B7280",
        originX: "center",
      });
      objects.push(xLabel);
    });

    // 图例
    if (showLegend) {
      const legendY = chartHeight - 25;
      const legendItemWidth = chartWidth / chartData.series.length;

      chartData.series.forEach((series, i) => {
        const x = 20 + i * legendItemWidth;

        const colorBox = new fabric.Rect({
          left: x,
          top: legendY,
          width: 12,
          height: 12,
          fill: series.color,
          rx: 2,
          ry: 2,
        });
        objects.push(colorBox);

        const legendLabel = new fabric.Text(series.name, {
          left: x + 16,
          top: legendY + 6,
          fontSize: 10,
          fill: "#6B7280",
          originY: "center",
        });
        objects.push(legendLabel);
      });
    }

    const group = new fabric.Group(objects, {
      left: 100,
      top: 100,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (group as any).id = `chart-${Date.now()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (group as any).chartType = chartType;

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    updateLayers();
    addToHistory(JSON.stringify(canvas.toJSON()));
  }, [
    canvas,
    chartData,
    chartType,
    chartWidth,
    chartHeight,
    title,
    showValues,
    showLegend,
    addToHistory,
    updateLayers,
  ]);

  const generateChart = () => {
    switch (chartType) {
      case "bar":
        createBarChart();
        break;
      case "pie":
        createPieChart();
        break;
      case "line":
      case "area":
        createLineChart();
        break;
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-white mb-4">数据可视化图表</h3>

      {/* 图表类型选择 */}
      <div className="mb-4">
        <span className="text-xs text-gray-400 block mb-2">图表类型</span>
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              type: "bar",
              icon: <BarChart3 className="w-5 h-5" />,
              label: "柱状图",
            },
            {
              type: "pie",
              icon: <PieChart className="w-5 h-5" />,
              label: "饼图",
            },
            {
              type: "line",
              icon: <LineChart className="w-5 h-5" />,
              label: "折线图",
            },
            {
              type: "area",
              icon: <TrendingUp className="w-5 h-5" />,
              label: "面积图",
            },
          ].map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => setChartType(type as ChartType)}
              className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                chartType === type
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              title={label}
            >
              {icon}
              <span className="text-[10px] mt-1">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 标题设置 */}
      <div className="mb-4">
        <span className="text-xs text-gray-500 block mb-1">图表标题</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-sm bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
        />
      </div>

      {/* 尺寸设置 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <span className="text-xs text-gray-500 block mb-1">宽度</span>
          <input
            type="number"
            value={chartWidth}
            onChange={(e) => setChartWidth(Number(e.target.value))}
            className="w-full text-sm bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
          />
        </div>
        <div>
          <span className="text-xs text-gray-500 block mb-1">高度</span>
          <input
            type="number"
            value={chartHeight}
            onChange={(e) => setChartHeight(Number(e.target.value))}
            className="w-full text-sm bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
          />
        </div>
      </div>

      {/* 选项 */}
      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-1 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={showValues}
            onChange={(e) => setShowValues(e.target.checked)}
          />
          显示数值
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={showLegend}
            onChange={(e) => setShowLegend(e.target.checked)}
          />
          显示图例
        </label>
      </div>

      {/* 数据系列编辑 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">数据系列</span>
          <button
            onClick={addSeries}
            className="p-1 hover:bg-gray-600 rounded text-blue-400"
            title="添加系列"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2 max-h-24 overflow-y-auto">
          {chartData.series.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={s.color}
                onChange={(e) => updateSeries(i, "color", e.target.value)}
                className="w-6 h-6 rounded cursor-pointer"
              />
              <input
                type="text"
                value={s.name}
                onChange={(e) => updateSeries(i, "name", e.target.value)}
                className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                placeholder="系列名称"
              />
              <button
                onClick={() => removeSeries(i)}
                disabled={chartData.series.length <= 1}
                className="p-1 hover:bg-red-900 rounded text-red-400 disabled:opacity-30"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 类别和数值编辑 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">类别数据</span>
          <button
            onClick={addCategory}
            className="p-1 hover:bg-gray-600 rounded text-blue-400"
            title="添加类别"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {chartData.categories.map((cat, catIndex) => (
            <div key={catIndex} className="flex items-center gap-1">
              <input
                type="text"
                value={cat}
                onChange={(e) => updateCategory(catIndex, e.target.value)}
                className="w-12 text-xs bg-gray-700 border border-gray-600 rounded px-1 py-1 text-white"
                placeholder="类别"
              />
              {chartData.series.map((s, serIndex) => (
                <input
                  key={serIndex}
                  type="number"
                  value={s.values[catIndex]}
                  onChange={(e) =>
                    updateValue(serIndex, catIndex, Number(e.target.value))
                  }
                  className="w-12 text-xs bg-gray-700 border border-gray-600 rounded px-1 py-1 text-white"
                  style={{ borderColor: s.color }}
                  title={s.name}
                />
              ))}
              <button
                onClick={() => removeCategory(catIndex)}
                disabled={chartData.categories.length <= 2}
                className="p-1 hover:bg-red-900 rounded text-red-400 disabled:opacity-30"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        onClick={generateChart}
        disabled={!canvas}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        生成图表
      </button>

      <p className="text-[10px] text-gray-400 mt-3 text-center">
        生成的图表为矢量图形，可自由编辑
      </p>
    </div>
  );
};

export default ChartGenerator;
