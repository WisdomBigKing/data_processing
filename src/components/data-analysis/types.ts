export interface DataFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  data: Record<string, unknown>[] | null;
  columns: ColumnInfo[];
  previewData: Record<string, unknown>[];
  status: 'uploading' | 'processing' | 'ready' | 'error';
  error?: string;
}

export interface ColumnInfo {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'mixed';
  sampleValues: unknown[];
  nullCount: number;
  uniqueCount: number;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'grouped-bar' | 'stacked-bar';
  title: string;
  xAxis?: string;
  yAxis?: string[];
  groupBy?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
}

export interface AnalysisRequest {
  fileIds: string[];
  prompt: string;
  chartType?: ChartConfig['type'];
}

export interface AnalysisResult {
  id: string;
  request: AnalysisRequest;
  summary: string;
  insights: string[];
  chartConfig: ChartConfig;
  chartData: Record<string, unknown>[];
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  chartData?: {
    config: ChartConfig;
    data: Record<string, unknown>[];
  };
  isLoading?: boolean;
}

export const CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

export const CHART_TYPES: { value: ChartConfig['type']; label: string }[] = [
  { value: 'bar', label: '柱状图' },
  { value: 'grouped-bar', label: '分组柱状图' },
  { value: 'stacked-bar', label: '堆叠柱状图' },
  { value: 'line', label: '折线图' },
  { value: 'area', label: '面积图' },
  { value: 'pie', label: '饼图' },
  { value: 'scatter', label: '散点图' },
];
