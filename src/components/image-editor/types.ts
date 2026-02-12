import * as fabric from 'fabric';

// ==================== 工具类型定义 ====================
export type ToolType = 
  // 选择工具
  | 'select'           // 选择工具
  | 'directSelect'     // 直接选择工具(编辑锚点)
  | 'lasso'            // 套索选择
  // 绘制工具
  | 'pen'              // 钢笔工具(贝塞尔曲线)
  | 'pencil'           // 铅笔工具(手绘)
  | 'brush'            // 画笔工具
  | 'eraser'           // 橡皮擦
  // 形状工具
  | 'rectangle'        // 矩形
  | 'roundedRect'      // 圆角矩形
  | 'ellipse'          // 椭圆
  | 'circle'           // 圆形
  | 'polygon'          // 多边形
  | 'star'             // 星形
  | 'line'             // 直线
  | 'polyline'         // 折线
  | 'arrow'            // 箭头
  | 'arc'              // 弧线
  | 'spiral'           // 螺旋
  // 文字工具
  | 'text'             // 点文字
  | 'areaText'         // 区域文字
  | 'pathText'         // 路径文字
  // 特殊工具
  | 'eyedropper'       // 吸管工具
  | 'paintBucket'      // 油漆桶(实时上色)
  | 'gradient'         // 渐变工具
  | 'symbolSpray'      // 符号喷枪
  | 'measure'          // 测量工具
  | 'slice'            // 切片工具
  | 'artboard'         // 画板工具
  | 'hand'             // 抓手工具
  | 'zoom';            // 缩放工具

// ==================== 路径查找器操作 ====================
export type PathfinderOperation = 
  | 'unite'            // 合并
  | 'minus_front'      // 减去顶层
  | 'minus_back'       // 减去底层
  | 'intersect'        // 相交
  | 'exclude'          // 差集
  | 'divide'           // 分割
  | 'trim'             // 修剪
  | 'merge'            // 合并路径
  | 'crop'             // 裁剪
  | 'outline';         // 轮廓

// ==================== 变换类型 ====================
export type TransformType = 
  | 'rotate'           // 旋转
  | 'scale'            // 缩放
  | 'skew'             // 倾斜
  | 'distort'          // 扭曲
  | 'perspective'      // 透视
  | 'warp'             // 变形
  | 'envelope'         // 封套扭曲
  | 'freeTransform';   // 自由变换

// ==================== 对齐方式 ====================
export type AlignType = 
  | 'left' | 'centerH' | 'right'
  | 'top' | 'centerV' | 'bottom'
  | 'distributeH' | 'distributeV';

// ==================== 色彩模式 ====================
export type ColorMode = 'RGB' | 'CMYK' | 'HSB' | 'LAB' | 'Grayscale';

// ==================== 渐变类型 ====================
export type GradientType = 'linear' | 'radial' | 'conic' | 'diamond';

// ==================== 画笔类型 ====================
export type BrushType = 
  | 'basic'            // 基础画笔
  | 'calligraphy'      // 书法笔
  | 'scatter'          // 散点画笔
  | 'art'              // 艺术画笔
  | 'pattern'          // 图案画笔
  | 'bristle';         // 毛刷

// ==================== 效果类型 ====================
export type EffectType = 
  | 'dropShadow'       // 投影
  | 'innerShadow'      // 内阴影
  | 'outerGlow'        // 外发光
  | 'innerGlow'        // 内发光
  | 'blur'             // 模糊
  | 'gaussianBlur'     // 高斯模糊
  | 'motionBlur'       // 运动模糊
  | 'radialBlur'       // 径向模糊
  | 'bevel'            // 斜面
  | 'emboss'           // 浮雕
  | 'roughen'          // 粗糙化
  | 'zigzag'           // 波纹
  | 'twirl'            // 旋转扭曲
  | 'pucker'           // 收缩
  | 'bloat';           // 膨胀

// ==================== 接口定义 ====================

export interface Point {
  x: number;
  y: number;
}

export interface AnchorPoint extends Point {
  handleIn?: Point;   // 入控制柄
  handleOut?: Point;  // 出控制柄
  type: 'corner' | 'smooth' | 'symmetric';  // 锚点类型
}

export interface PathData {
  id: string;
  points: AnchorPoint[];
  closed: boolean;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  opacity: number;
}

export interface LayerItem {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  object: fabric.Object;
  type?: string;
  parentId?: string;  // 用于嵌套图层
  children?: string[];
  blendMode?: string;
  opacity?: number;
}

export interface Artboard {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  objects: string[];  // 对象ID列表
}

export interface GradientStop {
  offset: number;     // 0-1
  color: string;
  opacity: number;
}

export interface GradientConfig {
  type: GradientType;
  angle: number;      // 角度（线性渐变）
  stops: GradientStop[];
  centerX?: number;   // 径向渐变中心
  centerY?: number;
  radius?: number;
}

export interface ColorSwatch {
  id: string;
  name: string;
  color: string;
  colorMode: ColorMode;
  isSpot?: boolean;   // 专色
  isGlobal?: boolean; // 全局色
}

export interface ColorPalette {
  id: string;
  name: string;
  swatches: ColorSwatch[];
}

export interface TextProperties {
  fontFamily: string;
  fontSize: number;
  fontWeight: string | number;
  fontStyle: 'normal' | 'italic' | 'oblique';
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight: number;
  letterSpacing: number;
  wordSpacing?: number;
  underline: boolean;
  linethrough: boolean;
  overline?: boolean;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: string;
  // 高级排版
  baselineShift?: number;
  tracking?: number;
  leading?: number;
  indent?: number;
  paragraphSpacing?: number;
}

export interface CharacterStyle extends TextProperties {
  id: string;
  name: string;
}

export interface ParagraphStyle {
  id: string;
  name: string;
  alignment: 'left' | 'center' | 'right' | 'justify' | 'justify-all';
  indent: number;
  firstLineIndent: number;
  spaceBefore: number;
  spaceAfter: number;
  lineHeight: number | 'auto';
  hyphenation: boolean;
  dropCap?: {
    lines: number;
    characters: number;
  };
}

export interface Appearance {
  fills: AppearanceFill[];
  strokes: AppearanceStroke[];
  effects: AppearanceEffect[];
  opacity: number;
  blendMode: string;
}

export interface AppearanceFill {
  id: string;
  type: 'solid' | 'gradient' | 'pattern';
  color?: string;
  gradient?: GradientConfig;
  patternId?: string;
  opacity: number;
  visible: boolean;
}

export interface AppearanceStroke {
  id: string;
  color: string;
  width: number;
  opacity: number;
  visible: boolean;
  dashArray?: number[];
  dashOffset?: number;
  lineCap: 'butt' | 'round' | 'square';
  lineJoin: 'miter' | 'round' | 'bevel';
  miterLimit?: number;
  align: 'center' | 'inside' | 'outside';
  // 高级描边
  profile?: 'uniform' | 'width' | 'tapered';
  arrowStart?: string;
  arrowEnd?: string;
}

export interface AppearanceEffect {
  id: string;
  type: EffectType;
  enabled: boolean;
  settings: Record<string, number | string | boolean>;
}

export interface GraphicStyle {
  id: string;
  name: string;
  appearance: Appearance;
  textProperties?: TextProperties;
  preview?: string;  // base64预览图
}

export interface Symbol {
  id: string;
  name: string;
  object: string;  // 序列化的fabric对象
  width: number;
  height: number;
  preview?: string;
  instances: string[];  // 实例ID列表
}

export interface Action {
  id: string;
  name: string;
  steps: ActionStep[];
  shortcut?: string;
}

export interface ActionStep {
  type: string;
  params: Record<string, unknown>;
}

export interface Guide {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number;
  color?: string;
  locked?: boolean;
}

export interface SmartGuide {
  type: 'edge' | 'center' | 'spacing' | 'size';
  position: number;
  orientation: 'horizontal' | 'vertical';
  sourceId?: string;
  targetId?: string;
}

export interface Grid {
  enabled: boolean;
  size: number;
  subdivisions: number;
  color: string;
  opacity: number;
  snapToGrid: boolean;
  showGrid: boolean;
}

export interface ShapeProperties {
  fill: string;
  fillType: 'solid' | 'gradient' | 'pattern' | 'none';
  gradient?: GradientConfig;
  stroke: string;
  strokeWidth: number;
  strokeDashArray?: number[];
  strokeLineCap?: 'butt' | 'round' | 'square';
  strokeLineJoin?: 'miter' | 'round' | 'bevel';
  opacity: number;
  // 形状特定属性
  cornerRadius?: number | number[];  // 圆角
  sides?: number;       // 多边形边数
  innerRadius?: number; // 星形内半径
  points?: number;      // 星形角数
}

export interface BrushSettings {
  type: BrushType;
  size: number;
  opacity: number;
  hardness: number;
  spacing: number;
  angle: number;
  roundness: number;
  scatter?: number;
  colorDynamics?: boolean;
  pressureSensitivity?: boolean;
}

export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf' | 'eps' | 'ai';
  quality: number;
  dpi: number;
  width?: number;
  height?: number;
  artboardId?: string;  // 导出特定画板
  exportArea: 'artboard' | 'selection' | 'all';
  includeBleed?: boolean;
  bleedSize?: number;
  colorProfile?: string;
  embedFonts?: boolean;
  outline?: boolean;     // 将文字转为轮廓
  preserveEditability?: boolean;
  compression?: 'none' | 'lzw' | 'jpeg' | 'zip';
  antiAlias?: boolean;
  interlaced?: boolean;
  transparency?: boolean;
  backgroundColor?: string;
}

export interface DocumentSettings {
  name: string;
  width: number;
  height: number;
  units: 'px' | 'mm' | 'cm' | 'in' | 'pt';
  colorMode: ColorMode;
  dpi: number;
  artboards: Artboard[];
  guides: Guide[];
  grid: Grid;
  bleed?: { top: number; right: number; bottom: number; left: number };
  slug?: { top: number; right: number; bottom: number; left: number };
}

// ==================== 钢笔工具状态 ====================
export interface PenToolState {
  isDrawing: boolean;
  currentPath: AnchorPoint[];
  previewPoint?: Point;
  selectedPointIndex?: number;
  mode: 'draw' | 'edit' | 'add' | 'remove' | 'convert';
}

// ==================== 编辑器状态 ====================
export interface EditorState {
  canvas: fabric.Canvas | null;
  activeTool: ToolType;
  activeObject: fabric.Object | null;
  zoom: number;
  pan: Point;
  history: string[];
  historyIndex: number;
  layers: LayerItem[];
  selectedLayerId: string | null;
  // 多画板
  artboards: Artboard[];
  activeArtboardId: string | null;
  // 颜色
  foregroundColor: string;
  backgroundColor: string;
  colorPalettes: ColorPalette[];
  activeColorPaletteId: string | null;
  // 样式
  graphicStyles: GraphicStyle[];
  characterStyles: CharacterStyle[];
  paragraphStyles: ParagraphStyle[];
  // 符号
  symbols: Symbol[];
  // 参考线
  guides: Guide[];
  smartGuidesEnabled: boolean;
  showRulers: boolean;
  // 网格
  grid: Grid;
  // 钢笔工具
  penToolState: PenToolState;
  // 画笔
  brushSettings: BrushSettings;
  // 文档
  documentSettings: DocumentSettings;
  // 剪贴板
  clipboard: string | null;
  // UI状态
  showLayers: boolean;
  showProperties: boolean;
  showSwatches: boolean;
  showSymbols: boolean;
  showAppearance: boolean;
}

// ==================== 预设数据 ====================
export const DEFAULT_FONTS = [
  // 必选字体
  '宋体',          // SimSun
  '黑体',          // SimHei
  'Times New Roman', // 新罗马体
  // 其他中文字体
  '微软雅黑',      // Microsoft YaHei
  '楷体',          // KaiTi
  '仿宋',          // FangSong
  '华文黑体',      // STHeiti
  '华文楷体',      // STKaiti
  '华文宋体',      // STSong
  // 英文字体
  'Arial',
  'Georgia',
  'Verdana',
  'Helvetica',
  'Courier New',
  'Tahoma',
];

export const DEFAULT_COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#FF0000', '#FF6600', '#FFCC00', '#FFFF00', '#99FF00', '#00FF00',
  '#00FF99', '#00FFFF', '#0099FF', '#0000FF', '#6600FF', '#FF00FF',
  '#FF0099', '#990000', '#994400', '#999900', '#009900', '#009999',
  '#000099', '#660099', '#990066', '#CC6666', '#FFCC99', '#FFFFCC',
];

export const MATERIAL_COLORS = {
  red: ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C'],
  pink: ['#FCE4EC', '#F8BBD9', '#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F'],
  purple: ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C'],
  blue: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1'],
  green: ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20'],
  orange: ['#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100'],
};

export const CANVAS_PRESETS = [
  { name: 'A4 (210 × 297 mm)', width: 2480, height: 3508, units: 'mm' as const },
  { name: 'A3 (297 × 420 mm)', width: 3508, height: 4961, units: 'mm' as const },
  { name: 'Letter (8.5 × 11 in)', width: 2550, height: 3300, units: 'in' as const },
  { name: 'Web 1920 × 1080', width: 1920, height: 1080, units: 'px' as const },
  { name: 'Web 1280 × 720', width: 1280, height: 720, units: 'px' as const },
  { name: '4K (3840 × 2160)', width: 3840, height: 2160, units: 'px' as const },
  { name: 'Instagram Post (1080 × 1080)', width: 1080, height: 1080, units: 'px' as const },
  { name: 'Instagram Story (1080 × 1920)', width: 1080, height: 1920, units: 'px' as const },
  { name: 'Logo (500 × 500)', width: 500, height: 500, units: 'px' as const },
  { name: 'Business Card (3.5 × 2 in)', width: 1050, height: 600, units: 'in' as const },
  { name: 'Poster (18 × 24 in)', width: 5400, height: 7200, units: 'in' as const },
  { name: 'iPhone 14 (1170 × 2532)', width: 1170, height: 2532, units: 'px' as const },
  { name: 'iPad Pro (2048 × 2732)', width: 2048, height: 2732, units: 'px' as const },
];

export const POLYGON_PRESETS = [
  { name: '三角形', sides: 3 },
  { name: '正方形', sides: 4 },
  { name: '五边形', sides: 5 },
  { name: '六边形', sides: 6 },
  { name: '七边形', sides: 7 },
  { name: '八边形', sides: 8 },
  { name: '十边形', sides: 10 },
  { name: '十二边形', sides: 12 },
];

export const STAR_PRESETS = [
  { name: '四角星', points: 4, innerRadius: 0.4 },
  { name: '五角星', points: 5, innerRadius: 0.38 },
  { name: '六角星', points: 6, innerRadius: 0.5 },
  { name: '八角星', points: 8, innerRadius: 0.5 },
  { name: '闪光', points: 12, innerRadius: 0.7 },
  { name: '爆炸', points: 16, innerRadius: 0.6 },
];

export const BLEND_MODES = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference',
  'exclusion', 'hue', 'saturation', 'color', 'luminosity',
];

export const ARROW_PRESETS = [
  { name: '无', start: 'none', end: 'none' },
  { name: '单箭头', start: 'none', end: 'arrow' },
  { name: '双箭头', start: 'arrow', end: 'arrow' },
  { name: '圆点箭头', start: 'none', end: 'circle' },
  { name: '方块箭头', start: 'none', end: 'square' },
  { name: '菱形箭头', start: 'none', end: 'diamond' },
];

// ==================== 工具提示 ====================
export const TOOL_TIPS: Record<ToolType, string> = {
  select: '选择工具 (V) - 双击选择图层',
  directSelect: '直接选择 (A) - 拖动移动图片',
  lasso: '套索选择 (Q) - 自由选择区域',
  pen: '钢笔工具 (P) - 绘制贝塞尔曲线',
  pencil: '铅笔工具 (N) - 手绘路径',
  brush: '画笔工具 (B) - 绘制笔触',
  eraser: '橡皮擦 (E) - 擦除对象',
  rectangle: '矩形工具 (M) - 绘制矩形',
  roundedRect: '圆角矩形 - 绘制圆角矩形',
  ellipse: '椭圆工具 (L) - 绘制椭圆',
  circle: '圆形工具 - 绘制正圆',
  polygon: '多边形工具 - 绘制多边形',
  star: '星形工具 - 绘制星形',
  line: '直线工具 (\\) - 绘制直线',
  polyline: '折线工具 - 绘制折线',
  arrow: '箭头工具 - 绘制箭头',
  arc: '弧线工具 - 绘制弧线',
  spiral: '螺旋工具 - 绘制螺旋',
  text: '文字工具 (T) - 添加点文字',
  areaText: '区域文字 - 在区域内排版',
  pathText: '路径文字 - 沿路径排列文字',
  eyedropper: '吸管工具 (I) - 拾取颜色',
  paintBucket: '油漆桶 (K) - 填充颜色',
  gradient: '渐变工具 (G) - 应用渐变',
  symbolSpray: '符号喷枪 - 喷洒符号',
  measure: '测量工具 - 测量距离',
  slice: '切片工具 - 创建切片',
  artboard: '画板工具 - 管理画板',
  hand: '抓手工具 (H) - 平移画布',
  zoom: '缩放工具 (Z) - 缩放视图',
};

// ==================== 快捷键映射 ====================
export const KEYBOARD_SHORTCUTS: Record<string, string> = {
  'v': 'select',
  'a': 'directSelect',
  'q': 'lasso',
  'p': 'pen',
  'n': 'pencil',
  'b': 'brush',
  'e': 'eraser',
  'm': 'rectangle',
  'l': 'ellipse',
  '\\': 'line',
  't': 'text',
  'i': 'eyedropper',
  'k': 'paintBucket',
  'g': 'gradient',
  'h': 'hand',
  'z': 'zoom',
  'ctrl+z': 'undo',
  'ctrl+shift+z': 'redo',
  'ctrl+c': 'copy',
  'ctrl+v': 'paste',
  'ctrl+x': 'cut',
  'ctrl+d': 'duplicate',
  'ctrl+a': 'selectAll',
  'ctrl+g': 'group',
  'ctrl+shift+g': 'ungroup',
  'ctrl+]': 'bringForward',
  'ctrl+[': 'sendBackward',
  'ctrl+shift+]': 'bringToFront',
  'ctrl+shift+[': 'sendToBack',
  'delete': 'delete',
  'backspace': 'delete',
  'ctrl+s': 'save',
  'ctrl+shift+s': 'saveAs',
  'ctrl+e': 'export',
  'ctrl+0': 'fitToScreen',
  'ctrl+1': 'actualSize',
  'ctrl++': 'zoomIn',
  'ctrl+-': 'zoomOut',
  'space': 'hand',
};
