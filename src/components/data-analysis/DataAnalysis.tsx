"use client";

import React, { useCallback } from "react";
import { useDataAnalysisStore } from "@/store/data-analysis-store";
import { FileUploader } from "./FileUploader";
import { DataPreview } from "./DataPreview";
import { ChatInterface } from "./ChatInterface";
import type { ChatMessage, ChartConfig } from "./types";
import { v4 as uuidv4 } from "uuid";
import { CHART_COLORS } from "./types";

export const DataAnalysis: React.FC = () => {
  const {
    files,
    selectedFileIds,
    addChatMessage,
    updateChatMessage,
    setIsAnalyzing,
  } = useDataAnalysisStore();

  const handleAnalyze = useCallback(
    async (prompt: string, chartType?: ChartConfig["type"]) => {
      setIsAnalyzing(true);

      // Add loading message
      const loadingMessageId = uuidv4();
      const loadingMessage: ChatMessage = {
        id: loadingMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isLoading: true,
      };
      addChatMessage(loadingMessage);

      try {
        // Get selected files data
        const selectedFiles = files.filter(
          (f) => selectedFileIds.includes(f.id) && f.data,
        );

        if (selectedFiles.length === 0) {
          updateChatMessage(loadingMessageId, {
            content: "请先选择要分析的数据文件。",
            isLoading: false,
          });
          setIsAnalyzing(false);
          return;
        }

        // Prepare data for analysis
        const allData: Record<string, unknown>[] = [];
        const columnSummary: Record<string, Set<string>> = {};

        selectedFiles.forEach((file) => {
          if (file.data) {
            file.data.forEach((row) => {
              const enhancedRow = { ...row, _source: file.name };
              allData.push(enhancedRow);
            });

            file.columns.forEach((col) => {
              if (!columnSummary[col.name]) {
                columnSummary[col.name] = new Set();
              }
              columnSummary[col.name].add(col.type);
            });
          }
        });

        // Analyze data based on prompt
        const analysisResult = analyzeData(
          prompt,
          allData,
          columnSummary,
          chartType || "bar",
        );

        updateChatMessage(loadingMessageId, {
          content: analysisResult.summary,
          isLoading: false,
          chartData: analysisResult.chartData
            ? {
                config: analysisResult.chartData.config,
                data: analysisResult.chartData.data,
              }
            : undefined,
        });
      } catch (error) {
        updateChatMessage(loadingMessageId, {
          content: `分析过程中出现错误: ${error instanceof Error ? error.message : "未知错误"}`,
          isLoading: false,
        });
      }

      setIsAnalyzing(false);
    },
    [files, selectedFileIds, addChatMessage, updateChatMessage, setIsAnalyzing],
  );

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Top Section - File Upload */}
      <div className="flex-shrink-0">
        <FileUploader />
      </div>

      {/* Main Content - Two Columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Left Column - Data Preview */}
        <div className="overflow-y-auto bg-gray-50 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">数据预览</h3>
          <DataPreview />
        </div>

        {/* Right Column - Chat Interface */}
        <div className="min-h-0">
          <ChatInterface onAnalyze={handleAnalyze} />
        </div>
      </div>
    </div>
  );
};

// Data analysis helper function
function analyzeData(
  prompt: string,
  data: Record<string, unknown>[],
  columnSummary: Record<string, Set<string>>,
  chartType: ChartConfig["type"],
): {
  summary: string;
  chartData?: { config: ChartConfig; data: Record<string, unknown>[] };
} {
  if (data.length === 0) {
    return { summary: "没有可分析的数据。" };
  }

  // Find numeric and categorical columns
  const numericColumns: string[] = [];
  const categoricalColumns: string[] = [];

  Object.entries(columnSummary).forEach(([col, types]) => {
    if (types.has("number")) {
      numericColumns.push(col);
    } else if (types.has("string")) {
      categoricalColumns.push(col);
    }
  });

  // Filter out internal columns
  const filteredNumericCols = numericColumns.filter((c) => !c.startsWith("_"));
  const filteredCategoricalCols = categoricalColumns.filter(
    (c) => !c.startsWith("_"),
  );

  // Determine X and Y axes based on data
  let xAxis =
    filteredCategoricalCols[0] ||
    Object.keys(data[0]).filter((k) => !k.startsWith("_"))[0];
  let yAxis = filteredNumericCols.slice(0, 3);

  if (yAxis.length === 0) {
    // If no numeric columns, try to count categorical values
    yAxis = ["count"];
  }

  // Aggregate data by X axis
  const aggregatedData = new Map<string, Record<string, number>>();

  data.forEach((row) => {
    const key = String(row[xAxis] || "Unknown");
    if (!aggregatedData.has(key)) {
      aggregatedData.set(key, {});
      yAxis.forEach((y) => {
        aggregatedData.get(key)![y] = 0;
      });
    }

    const agg = aggregatedData.get(key)!;
    if (yAxis[0] === "count") {
      agg["count"] = (agg["count"] || 0) + 1;
    } else {
      yAxis.forEach((y) => {
        const val = Number(row[y]) || 0;
        agg[y] = (agg[y] || 0) + val;
      });
    }
  });

  // Convert to array and sort
  const chartData = Array.from(aggregatedData.entries())
    .map(([key, values]) => ({
      [xAxis]: key,
      ...values,
    }))
    .sort((a, b) => {
      const valA = Number(yAxis[0] === "count" ? a["count"] : a[yAxis[0]]) || 0;
      const valB = Number(yAxis[0] === "count" ? b["count"] : b[yAxis[0]]) || 0;
      return valB - valA;
    })
    .slice(0, 20); // Limit to top 20

  // Generate summary
  const totalRecords = data.length;
  const uniqueCategories = aggregatedData.size;

  let maxItem = "";
  let maxValue = 0;
  let minItem = "";
  let minValue = Infinity;

  chartData.forEach((item) => {
    const val =
      Number(yAxis[0] === "count" ? item["count"] : item[yAxis[0]]) || 0;
    if (val > maxValue) {
      maxValue = val;
      maxItem = String(item[xAxis]);
    }
    if (val < minValue) {
      minValue = val;
      minItem = String(item[xAxis]);
    }
  });

  const summaryParts = [
    `📊 **数据分析结果**\n`,
    `根据您的需求"${prompt}"，我对数据进行了分析：\n`,
    `- 共分析 **${totalRecords}** 条记录`,
    `- 按 **${xAxis}** 维度分类，共 **${uniqueCategories}** 个类别`,
  ];

  if (yAxis[0] !== "count") {
    summaryParts.push(`- 分析指标: ${yAxis.join(", ")}`);
  }

  summaryParts.push(
    `\n**关键发现:**`,
    `- 最高值: **${maxItem}** (${maxValue.toLocaleString()})`,
    `- 最低值: **${minItem}** (${minValue.toLocaleString()})`,
  );

  // Calculate average
  const sum = chartData.reduce((acc, item) => {
    const val =
      Number(yAxis[0] === "count" ? item["count"] : item[yAxis[0]]) || 0;
    return acc + val;
  }, 0);
  const avg = sum / chartData.length;
  summaryParts.push(`- 平均值: **${avg.toFixed(2)}**`);

  // Generate chart config
  const chartConfig: ChartConfig = {
    type: chartType,
    title: `${xAxis} 数据分析`,
    xAxis,
    yAxis: yAxis[0] === "count" ? ["count"] : yAxis,
    showLegend: yAxis.length > 1,
    showGrid: true,
    colors: CHART_COLORS,
  };

  return {
    summary: summaryParts.join("\n"),
    chartData: {
      config: chartConfig,
      data: chartData,
    },
  };
}
