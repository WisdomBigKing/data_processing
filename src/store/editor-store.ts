import { create } from 'zustand';
import * as fabric from 'fabric';
import type { 
  ToolType, 
  LayerItem, 
  Artboard,
  ColorPalette,
  GraphicStyle,
  CharacterStyle,
  ParagraphStyle,
  Symbol,
  Guide,
  Grid,
  PenToolState,
  BrushSettings,
  DocumentSettings,
  GradientConfig,
  Point,
  AnchorPoint,
  AlignType,
  PathfinderOperation,
} from '@/components/image-editor/types';

// 默认网格设置
const defaultGrid: Grid = {
  enabled: true,
  size: 10,
  subdivisions: 4,
  color: '#CCCCCC',
  opacity: 0.5,
  snapToGrid: false,
  showGrid: false,
};

// 默认钢笔工具状态
const defaultPenToolState: PenToolState = {
  isDrawing: false,
  currentPath: [],
  mode: 'draw',
};

// 默认画笔设置
const defaultBrushSettings: BrushSettings = {
  type: 'basic',
  size: 10,
  opacity: 1,
  hardness: 1,
  spacing: 0.25,
  angle: 0,
  roundness: 1,
};

// 默认文档设置
const defaultDocumentSettings: DocumentSettings = {
  name: '未命名文档',
  width: 1920,
  height: 1080,
  units: 'px',
  colorMode: 'RGB',
  dpi: 300,
  artboards: [],
  guides: [],
  grid: defaultGrid,
};

// 默认色板
const defaultColorPalette: ColorPalette = {
  id: 'default',
  name: '默认色板',
  swatches: [
    { id: '1', name: '黑色', color: '#000000', colorMode: 'RGB' },
    { id: '2', name: '白色', color: '#FFFFFF', colorMode: 'RGB' },
    { id: '3', name: '红色', color: '#FF0000', colorMode: 'RGB' },
    { id: '4', name: '绿色', color: '#00FF00', colorMode: 'RGB' },
    { id: '5', name: '蓝色', color: '#0000FF', colorMode: 'RGB' },
    { id: '6', name: '黄色', color: '#FFFF00', colorMode: 'RGB' },
    { id: '7', name: '青色', color: '#00FFFF', colorMode: 'RGB' },
    { id: '8', name: '品红', color: '#FF00FF', colorMode: 'RGB' },
  ],
};

interface EditorStore {
  // 核心状态
  canvas: fabric.Canvas | null;
  activeTool: ToolType;
  previousTool: ToolType;
  activeObject: fabric.Object | null;
  selectedObjects: fabric.Object[];
  zoom: number;
  pan: Point;
  history: string[];
  historyIndex: number;
  isHistoryPaused: boolean;
  
  // 画布尺寸
  canvasWidth: number;
  canvasHeight: number;
  
  // 图层
  layers: LayerItem[];
  selectedLayerId: string | null;
  
  // 多画板
  artboards: Artboard[];
  activeArtboardId: string | null;
  
  // 颜色
  foregroundColor: string;
  backgroundColor: string;
  colorPalettes: ColorPalette[];
  activeColorPaletteId: string;
  
  // 渐变
  currentGradient: GradientConfig | null;
  
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
  
  // 形状工具设置
  polygonSides: number;
  starPoints: number;
  starInnerRadius: number;
  cornerRadius: number;
  
  // UI状态
  showLayers: boolean;
  showProperties: boolean;
  showSwatches: boolean;
  showSymbols: boolean;
  showAppearance: boolean;
  showPathfinder: boolean;
  showAlign: boolean;
  showTransform: boolean;

  // 核心方法
  setCanvas: (canvas: fabric.Canvas | null) => void;
  setActiveTool: (tool: ToolType) => void;
  setActiveObject: (obj: fabric.Object | null) => void;
  setSelectedObjects: (objs: fabric.Object[]) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  
  // 历史记录
  addToHistory: (state: string) => void;
  undo: () => void;
  redo: () => void;
  pauseHistory: () => void;
  resumeHistory: () => void;
  
  // 图层操作
  updateLayers: () => void;
  setSelectedLayerId: (id: string | null) => void;
  setCanvasSize: (width: number, height: number) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  moveLayerUp: (id: string) => void;
  moveLayerDown: (id: string) => void;
  deleteLayer: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  duplicateLayer: (id: string) => void;
  
  // 颜色操作
  setForegroundColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  swapColors: () => void;
  addColorToPalette: (color: string, name?: string) => void;
  setCurrentGradient: (gradient: GradientConfig | null) => void;
  
  // 对齐操作
  alignObjects: (type: AlignType) => void;
  
  // 路径查找器操作
  pathfinderOperation: (operation: PathfinderOperation) => void;
  
  // 组操作
  groupSelected: () => void;
  ungroupSelected: () => void;
  
  // 变换操作
  flipHorizontal: () => void;
  flipVertical: () => void;
  rotateSelected: (angle: number) => void;
  
  // 排列操作
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  
  // 钢笔工具
  setPenToolState: (state: Partial<PenToolState>) => void;
  addPenPoint: (point: AnchorPoint) => void;
  updatePenPreview: (point: Point) => void;
  finishPenPath: (closed: boolean) => void;
  
  // 画笔设置
  setBrushSettings: (settings: Partial<BrushSettings>) => void;
  
  // 形状设置
  setPolygonSides: (sides: number) => void;
  setStarPoints: (points: number) => void;
  setStarInnerRadius: (radius: number) => void;
  setCornerRadius: (radius: number) => void;
  
  // 参考线
  addGuide: (orientation: 'horizontal' | 'vertical', position: number) => void;
  removeGuide: (id: string) => void;
  toggleSmartGuides: () => void;
  toggleRulers: () => void;
  
  // 网格
  setGrid: (grid: Partial<Grid>) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  
  // 符号
  createSymbol: (name: string) => void;
  deleteSymbol: (id: string) => void;
  placeSymbol: (id: string, x: number, y: number) => void;
  
  // UI面板
  togglePanel: (panel: 'layers' | 'properties' | 'swatches' | 'symbols' | 'appearance' | 'pathfinder' | 'align' | 'transform') => void;
  
  // 文档
  setDocumentSettings: (settings: Partial<DocumentSettings>) => void;
  
  // 导入导出
  exportToSVG: () => string;
  importSVG: (svg: string) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  // 核心状态初始值
  canvas: null,
  activeTool: 'directSelect',
  previousTool: 'directSelect',
  activeObject: null,
  selectedObjects: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
  history: [],
  historyIndex: -1,
  isHistoryPaused: false,
  
  canvasWidth: 800,
  canvasHeight: 600,
  
  layers: [],
  selectedLayerId: null,
  
  artboards: [],
  activeArtboardId: null,
  
  foregroundColor: '#000000',
  backgroundColor: '#FFFFFF',
  colorPalettes: [defaultColorPalette],
  activeColorPaletteId: 'default',
  
  currentGradient: null,
  
  graphicStyles: [],
  characterStyles: [],
  paragraphStyles: [],
  
  symbols: [],
  
  guides: [],
  smartGuidesEnabled: true,
  showRulers: true,
  
  grid: defaultGrid,
  
  penToolState: defaultPenToolState,
  
  brushSettings: defaultBrushSettings,
  
  documentSettings: defaultDocumentSettings,
  
  clipboard: null,
  
  polygonSides: 6,
  starPoints: 5,
  starInnerRadius: 0.4,
  cornerRadius: 0,
  
  showLayers: true,
  showProperties: true,
  showSwatches: false,
  showSymbols: false,
  showAppearance: false,
  showPathfinder: false,
  showAlign: false,
  showTransform: false,

  // ==================== 核心方法 ====================
  setCanvas: (canvas) => set({ canvas }),

  setActiveTool: (tool) => {
    const { canvas, activeTool } = get();
    if (canvas) {
      // 保存之前的工具
      set({ previousTool: activeTool });
      
      // 重置绘图模式
      canvas.isDrawingMode = tool === 'pencil' || tool === 'brush';
      canvas.selection = tool === 'select' || tool === 'lasso';
      
      // 配置画笔
      if ((tool === 'pencil' || tool === 'brush') && canvas.freeDrawingBrush) {
        const { foregroundColor, brushSettings } = get();
        canvas.freeDrawingBrush.color = foregroundColor;
        canvas.freeDrawingBrush.width = brushSettings.size;
      }
    }
    set({ activeTool: tool });
  },

  setActiveObject: (obj) => set({ activeObject: obj }),
  
  setSelectedObjects: (objs) => set({ selectedObjects: objs }),

  setZoom: (zoom) => {
    const { canvas } = get();
    const clampedZoom = Math.max(0.1, Math.min(10, zoom));
    if (canvas) {
      canvas.setZoom(clampedZoom);
      canvas.renderAll();
    }
    set({ zoom: clampedZoom });
  },
  
  setPan: (pan) => {
    const { canvas } = get();
    if (canvas) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vpt = canvas.viewportTransform as any;
      if (vpt) {
        vpt[4] = pan.x;
        vpt[5] = pan.y;
        canvas.requestRenderAll();
      }
    }
    set({ pan });
  },

  // ==================== 历史记录 ====================
  addToHistory: (state) => {
    const { history, historyIndex, isHistoryPaused } = get();
    if (isHistoryPaused) return;
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    if (newHistory.length > 100) {
      newHistory.shift();
    }
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { canvas, history, historyIndex } = get();
    console.log('[Undo] historyIndex:', historyIndex, 'history.length:', history.length);
    if (historyIndex > 0 && canvas) {
      const newIndex = historyIndex - 1;
      set({ isHistoryPaused: true }); // 暂停历史记录避免循环
      
      // Fabric.js v6 使用 Promise
      canvas.loadFromJSON(JSON.parse(history[newIndex])).then(() => {
        canvas.renderAll();
        get().updateLayers();
        set({ historyIndex: newIndex, isHistoryPaused: false });
      }).catch((err: Error) => {
        console.error('[Undo] Error:', err);
        set({ isHistoryPaused: false });
      });
    }
  },

  redo: () => {
    const { canvas, history, historyIndex } = get();
    console.log('[Redo] historyIndex:', historyIndex, 'history.length:', history.length);
    if (historyIndex < history.length - 1 && canvas) {
      const newIndex = historyIndex + 1;
      set({ isHistoryPaused: true }); // 暂停历史记录避免循环
      
      // Fabric.js v6 使用 Promise
      canvas.loadFromJSON(JSON.parse(history[newIndex])).then(() => {
        canvas.renderAll();
        get().updateLayers();
        set({ historyIndex: newIndex, isHistoryPaused: false });
      }).catch((err: Error) => {
        console.error('[Redo] Error:', err);
        set({ isHistoryPaused: false });
      });
    }
  },
  
  pauseHistory: () => set({ isHistoryPaused: true }),
  resumeHistory: () => set({ isHistoryPaused: false }),

  // ==================== 图层操作 ====================
  updateLayers: () => {
    const { canvas } = get();
    if (!canvas) return;

    const objects = canvas.getObjects();
    const usedIds = new Set<string>();
    
    // 过滤掉预览对象、网格、参考线等非用户对象
    const isUserObject = (obj: fabric.Object): boolean => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyObj = obj as any;
      return !anyObj.isPenPreview && 
             !anyObj.isPenPreviewLine && 
             !anyObj.isGrid && 
             !anyObj.isGuide;
    };
    
    // 获取对象名称
    const getObjectName = (obj: fabric.Object): string => {
      const objType = obj.type;
      if (objType === 'i-text' || objType === 'text' || objType === 'textbox') {
        return `文字: ${(obj as fabric.IText).text?.substring(0, 15) || 'Text'}`;
      } else if (objType === 'rect') {
        return '矩形';
      } else if (objType === 'circle') {
        return '圆形';
      } else if (objType === 'ellipse') {
        return '椭圆';
      } else if (objType === 'line') {
        return '直线';
      } else if (objType === 'path') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pathName = (obj as any).customName;
        return pathName || '路径';
      } else if (objType === 'polygon') {
        return '多边形';
      } else if (objType === 'polyline') {
        return '折线';
      } else if (objType === 'image') {
        return '图像';
      } else if (objType === 'group') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const groupName = (obj as any).customName;
        return groupName || '组';
      } else if (objType === 'triangle') {
        return '三角形';
      }
      return 'Object';
    };
    
    // 递归处理对象，支持 group 的子元素
    const processObject = (obj: fabric.Object, index: number, parentId?: string): LayerItem[] => {
      if (!isUserObject(obj)) return [];
      
      let id = (obj as fabric.Object & { id?: string }).id;
      if (!id || usedIds.has(id)) {
        id = `layer-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
      }
      usedIds.add(id);
      (obj as fabric.Object & { id?: string }).id = id;
      
      const layer: LayerItem = {
        id,
        name: getObjectName(obj),
        visible: obj.visible !== false,
        locked: obj.selectable === false,
        object: obj,
        type: obj.type,
        parentId,
        children: [],
        blendMode: 'normal',
        opacity: obj.opacity || 1,
      };
      
      const result: LayerItem[] = [layer];
      
      // 如果是 group，递归处理子元素
      if (obj.type === 'group') {
        const group = obj as fabric.Group;
        const groupObjects = group.getObjects ? group.getObjects() : [];
        const childIds: string[] = [];
        
        groupObjects.forEach((childObj, childIndex) => {
          const childLayers = processObject(childObj, childIndex, id);
          childLayers.forEach(childLayer => {
            if (childLayer.parentId === id) {
              childIds.push(childLayer.id);
            }
          });
          result.push(...childLayers);
        });
        
        layer.children = childIds;
      }
      
      return result;
    };
    
    const allLayers: LayerItem[] = [];
    objects.forEach((obj, index) => {
      const layers = processObject(obj, index);
      allLayers.push(...layers);
    });

    // 只反转顶层图层顺序，保持子元素顺序
    const topLevelLayers = allLayers.filter(l => !l.parentId);
    const childLayers = allLayers.filter(l => l.parentId);
    
    set({ layers: [...topLevelLayers.reverse(), ...childLayers] });
  },

  setSelectedLayerId: (id) => {
    const { canvas, layers } = get();
    if (canvas && id) {
      const layer = layers.find(l => l.id === id);
      if (layer) {
        canvas.setActiveObject(layer.object);
        canvas.renderAll();
      }
    }
    set({ selectedLayerId: id });
  },

  setCanvasSize: (width, height) => {
    const { canvas } = get();
    if (canvas) {
      canvas.setDimensions({ width, height });
      canvas.renderAll();
    }
    set({ canvasWidth: width, canvasHeight: height });
  },

  toggleLayerVisibility: (id) => {
    const { canvas, layers } = get();
    const layer = layers.find(l => l.id === id);
    if (layer && canvas) {
      layer.object.visible = !layer.object.visible;
      canvas.renderAll();
      get().updateLayers();
    }
  },

  toggleLayerLock: (id) => {
    const { canvas, layers } = get();
    const layer = layers.find(l => l.id === id);
    if (layer && canvas) {
      const isLocked = layer.object.selectable === false;
      layer.object.selectable = isLocked;
      layer.object.evented = isLocked;
      canvas.renderAll();
      get().updateLayers();
    }
  },

  moveLayerUp: (id) => {
    const { canvas, layers } = get();
    const layerIndex = layers.findIndex(l => l.id === id);
    if (layerIndex > 0 && canvas) {
      const layer = layers[layerIndex];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (canvas as any).bringObjectForward(layer.object);
      canvas.renderAll();
      get().updateLayers();
    }
  },

  moveLayerDown: (id) => {
    const { canvas, layers } = get();
    const layerIndex = layers.findIndex(l => l.id === id);
    if (layerIndex < layers.length - 1 && canvas) {
      const layer = layers[layerIndex];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (canvas as any).sendObjectBackwards(layer.object);
      canvas.renderAll();
      get().updateLayers();
    }
  },

  deleteLayer: (id) => {
    const { canvas, layers, addToHistory } = get();
    const layer = layers.find(l => l.id === id);
    if (layer && canvas) {
      canvas.remove(layer.object);
      canvas.renderAll();
      get().updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  },
  
  renameLayer: (id, name) => {
    const { layers } = get();
    const newLayers = layers.map(l => l.id === id ? { ...l, name } : l);
    set({ layers: newLayers });
  },
  
  duplicateLayer: async (id) => {
    const { canvas, layers, addToHistory, updateLayers } = get();
    const layer = layers.find(l => l.id === id);
    if (layer && canvas) {
      const cloned = await layer.object.clone();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cloned as any).id = `layer-${Date.now()}`;
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  },

  // ==================== 颜色操作 ====================
  setForegroundColor: (color) => {
    const { canvas } = get();
    if (canvas) {
      const activeObj = canvas.getActiveObject();
      if (activeObj) {
        if (activeObj.type === 'i-text' || activeObj.type === 'textbox') {
          activeObj.set('fill', color);
        } else {
          activeObj.set('fill', color);
        }
        canvas.renderAll();
      }
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = color;
      }
    }
    set({ foregroundColor: color });
  },
  
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  
  swapColors: () => {
    const { foregroundColor, backgroundColor } = get();
    set({ foregroundColor: backgroundColor, backgroundColor: foregroundColor });
  },
  
  addColorToPalette: (color, name) => {
    const { colorPalettes, activeColorPaletteId } = get();
    const newPalettes = colorPalettes.map(palette => {
      if (palette.id === activeColorPaletteId) {
        return {
          ...palette,
          swatches: [...palette.swatches, {
            id: `swatch-${Date.now()}`,
            name: name || color,
            color,
            colorMode: 'RGB' as const,
          }],
        };
      }
      return palette;
    });
    set({ colorPalettes: newPalettes });
  },
  
  setCurrentGradient: (gradient) => set({ currentGradient: gradient }),

  // ==================== 对齐操作 ====================
  alignObjects: (type) => {
    const { canvas, addToHistory } = get();
    if (!canvas) return;
    
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selection = activeObj as any;
    if (selection.type !== 'activeSelection' && selection._objects === undefined) return;
    
    const objects = selection._objects || [activeObj];
    if (objects.length < 2) return;
    
    const bounds = objects.map((obj: fabric.Object) => ({
      left: obj.left || 0,
      top: obj.top || 0,
      right: (obj.left || 0) + (obj.width || 0) * (obj.scaleX || 1),
      bottom: (obj.top || 0) + (obj.height || 0) * (obj.scaleY || 1),
      centerX: (obj.left || 0) + ((obj.width || 0) * (obj.scaleX || 1)) / 2,
      centerY: (obj.top || 0) + ((obj.height || 0) * (obj.scaleY || 1)) / 2,
    }));
    
    const minLeft = Math.min(...bounds.map((b: { left: number }) => b.left));
    const maxRight = Math.max(...bounds.map((b: { right: number }) => b.right));
    const minTop = Math.min(...bounds.map((b: { top: number }) => b.top));
    const maxBottom = Math.max(...bounds.map((b: { bottom: number }) => b.bottom));
    const centerX = (minLeft + maxRight) / 2;
    const centerY = (minTop + maxBottom) / 2;
    
    objects.forEach((obj: fabric.Object, i: number) => {
      const b = bounds[i];
      const objWidth = (obj.width || 0) * (obj.scaleX || 1);
      const objHeight = (obj.height || 0) * (obj.scaleY || 1);
      
      switch (type) {
        case 'left':
          obj.set('left', minLeft);
          break;
        case 'centerH':
          obj.set('left', centerX - objWidth / 2);
          break;
        case 'right':
          obj.set('left', maxRight - objWidth);
          break;
        case 'top':
          obj.set('top', minTop);
          break;
        case 'centerV':
          obj.set('top', centerY - objHeight / 2);
          break;
        case 'bottom':
          obj.set('top', maxBottom - objHeight);
          break;
      }
      obj.setCoords();
    });
    
    canvas.renderAll();
    addToHistory(JSON.stringify(canvas.toJSON()));
  },

  // ==================== 路径查找器 ====================
  pathfinderOperation: (operation) => {
    const { canvas, addToHistory } = get();
    if (!canvas) return;
    
    const activeObj = canvas.getActiveObject();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!activeObj || (activeObj as any).type !== 'activeSelection') return;
    
    // 路径查找器操作需要更复杂的实现，这里提供基础框架
    console.log('Pathfinder operation:', operation);
    // TODO: 实现完整的路径布尔运算
    addToHistory(JSON.stringify(canvas.toJSON()));
  },

  // ==================== 组操作 ====================
  groupSelected: () => {
    const { canvas, addToHistory, updateLayers } = get();
    if (!canvas) return;
    
    const activeObj = canvas.getActiveObject();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (activeObj && (activeObj as any).type === 'activeSelection' && (activeObj as any).toGroup) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (activeObj as any).toGroup();
      canvas.renderAll();
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  },
  
  ungroupSelected: () => {
    const { canvas, addToHistory, updateLayers } = get();
    if (!canvas) return;
    
    const activeObj = canvas.getActiveObject();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (activeObj && activeObj.type === 'group' && (activeObj as any).toActiveSelection) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (activeObj as any).toActiveSelection();
      canvas.renderAll();
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  },

  // ==================== 变换操作 ====================
  flipHorizontal: () => {
    const { canvas, addToHistory } = get();
    if (!canvas) return;
    
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.set('flipX', !activeObj.flipX);
      canvas.renderAll();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  },
  
  flipVertical: () => {
    const { canvas, addToHistory } = get();
    if (!canvas) return;
    
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.set('flipY', !activeObj.flipY);
      canvas.renderAll();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  },
  
  rotateSelected: (angle) => {
    const { canvas, addToHistory } = get();
    if (!canvas) return;
    
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.rotate((activeObj.angle || 0) + angle);
      canvas.renderAll();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  },

  // ==================== 排列操作 ====================
  bringToFront: () => {
    const { canvas, addToHistory, updateLayers } = get();
    if (!canvas) return;
    
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (canvas as any).bringObjectToFront(activeObj);
      canvas.renderAll();
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  },
  
  sendToBack: () => {
    const { canvas, addToHistory, updateLayers } = get();
    if (!canvas) return;
    
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (canvas as any).sendObjectToBack(activeObj);
      canvas.renderAll();
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  },
  
  bringForward: () => {
    const { canvas, addToHistory, updateLayers } = get();
    if (!canvas) return;
    
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (canvas as any).bringObjectForward(activeObj);
      canvas.renderAll();
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  },
  
  sendBackward: () => {
    const { canvas, addToHistory, updateLayers } = get();
    if (!canvas) return;
    
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (canvas as any).sendObjectBackwards(activeObj);
      canvas.renderAll();
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  },

  // ==================== 钢笔工具 ====================
  setPenToolState: (state) => {
    const { penToolState } = get();
    set({ penToolState: { ...penToolState, ...state } });
  },
  
  addPenPoint: (point) => {
    const { penToolState } = get();
    set({
      penToolState: {
        ...penToolState,
        currentPath: [...penToolState.currentPath, point],
        isDrawing: true,
      },
    });
  },
  
  updatePenPreview: (point) => {
    const { penToolState } = get();
    set({
      penToolState: {
        ...penToolState,
        previewPoint: point,
      },
    });
  },
  
  finishPenPath: (closed) => {
    const { canvas, penToolState, foregroundColor, addToHistory, updateLayers } = get();
    if (!canvas || penToolState.currentPath.length < 2) {
      set({ penToolState: defaultPenToolState });
      return;
    }
    
    // 将锚点转换为fabric路径
    const pathData = penToolState.currentPath.map((pt, i) => {
      if (i === 0) {
        return `M ${pt.x} ${pt.y}`;
      }
      const prev = penToolState.currentPath[i - 1];
      if (pt.handleIn && prev.handleOut) {
        return `C ${prev.handleOut.x} ${prev.handleOut.y} ${pt.handleIn.x} ${pt.handleIn.y} ${pt.x} ${pt.y}`;
      }
      return `L ${pt.x} ${pt.y}`;
    }).join(' ') + (closed ? ' Z' : '');
    
    const path = new fabric.Path(pathData, {
      fill: closed ? foregroundColor : 'transparent',
      stroke: foregroundColor,
      strokeWidth: 2,
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (path as any).id = `path-${Date.now()}`;
    canvas.add(path);
    canvas.setActiveObject(path);
    canvas.renderAll();
    updateLayers();
    addToHistory(JSON.stringify(canvas.toJSON()));
    
    set({ penToolState: defaultPenToolState });
  },

  // ==================== 画笔设置 ====================
  setBrushSettings: (settings) => {
    const { brushSettings, canvas } = get();
    const newSettings = { ...brushSettings, ...settings };
    
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = newSettings.size;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (canvas.freeDrawingBrush as any).opacity = newSettings.opacity;
    }
    
    set({ brushSettings: newSettings });
  },

  // ==================== 形状设置 ====================
  setPolygonSides: (sides) => set({ polygonSides: Math.max(3, Math.min(12, sides)) }),
  setStarPoints: (points) => set({ starPoints: Math.max(3, Math.min(32, points)) }),
  setStarInnerRadius: (radius) => set({ starInnerRadius: Math.max(0.1, Math.min(0.9, radius)) }),
  setCornerRadius: (radius) => set({ cornerRadius: Math.max(0, radius) }),

  // ==================== 参考线 ====================
  addGuide: (orientation, position) => {
    const { guides } = get();
    const newGuide: Guide = {
      id: `guide-${Date.now()}`,
      orientation,
      position,
      color: '#00AAFF',
    };
    set({ guides: [...guides, newGuide] });
  },
  
  removeGuide: (id) => {
    const { guides } = get();
    set({ guides: guides.filter(g => g.id !== id) });
  },
  
  toggleSmartGuides: () => {
    const { smartGuidesEnabled } = get();
    set({ smartGuidesEnabled: !smartGuidesEnabled });
  },
  
  toggleRulers: () => {
    const { showRulers } = get();
    set({ showRulers: !showRulers });
  },

  // ==================== 网格 ====================
  setGrid: (gridSettings) => {
    const { grid } = get();
    set({ grid: { ...grid, ...gridSettings } });
  },
  
  toggleGrid: () => {
    const { grid } = get();
    set({ grid: { ...grid, showGrid: !grid.showGrid } });
  },
  
  toggleSnapToGrid: () => {
    const { grid } = get();
    set({ grid: { ...grid, snapToGrid: !grid.snapToGrid } });
  },

  // ==================== 符号 ====================
  createSymbol: (name) => {
    const { canvas, symbols } = get();
    if (!canvas) return;
    
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;
    
    const newSymbol: Symbol = {
      id: `symbol-${Date.now()}`,
      name,
      object: JSON.stringify(activeObj.toJSON()),
      width: (activeObj.width || 0) * (activeObj.scaleX || 1),
      height: (activeObj.height || 0) * (activeObj.scaleY || 1),
      instances: [],
    };
    
    set({ symbols: [...symbols, newSymbol] });
  },
  
  deleteSymbol: (id) => {
    const { symbols } = get();
    set({ symbols: symbols.filter(s => s.id !== id) });
  },
  
  placeSymbol: (id, x, y) => {
    const { canvas, symbols, addToHistory, updateLayers } = get();
    if (!canvas) return;
    
    const symbol = symbols.find(s => s.id === id);
    if (!symbol) return;
    
    fabric.util.enlivenObjects([JSON.parse(symbol.object)]).then((objects) => {
      if (objects.length > 0) {
        const obj = objects[0] as fabric.Object;
        obj.set({ left: x, top: y });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any).symbolId = id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any).id = `instance-${Date.now()}`;
        canvas.add(obj);
        canvas.renderAll();
        updateLayers();
        addToHistory(JSON.stringify(canvas.toJSON()));
      }
    });
  },

  // ==================== UI面板 ====================
  togglePanel: (panel) => {
    const panelMap = {
      layers: 'showLayers',
      properties: 'showProperties',
      swatches: 'showSwatches',
      symbols: 'showSymbols',
      appearance: 'showAppearance',
      pathfinder: 'showPathfinder',
      align: 'showAlign',
      transform: 'showTransform',
    } as const;
    
    const key = panelMap[panel];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set({ [key]: !(get() as any)[key] });
  },

  // ==================== 文档设置 ====================
  setDocumentSettings: (settings) => {
    const { documentSettings } = get();
    set({ documentSettings: { ...documentSettings, ...settings } });
  },

  // ==================== 导入导出 ====================
  exportToSVG: () => {
    const { canvas } = get();
    if (!canvas) return '';
    return canvas.toSVG();
  },
  
  importSVG: (svg) => {
    const { canvas, addToHistory, updateLayers } = get();
    if (!canvas) return;
    
    fabric.loadSVGFromString(svg).then(({ objects }) => {
      if (objects.length > 0) {
        const group = new fabric.Group(objects.filter(Boolean) as fabric.Object[]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (group as any).id = `svg-${Date.now()}`;
        canvas.add(group);
        canvas.centerObject(group);
        canvas.setActiveObject(group);
        canvas.renderAll();
        updateLayers();
        addToHistory(JSON.stringify(canvas.toJSON()));
      }
    });
  },
}));
