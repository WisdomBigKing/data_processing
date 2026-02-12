"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEditorStore } from "@/store/editor-store";
import { ToolbarPro } from "./ToolbarPro";
import { MenuBar } from "./MenuBar";
import { ColorPanel } from "./ColorPanel";
import { GradientEditor } from "./GradientEditor";
import { PathfinderPanel } from "./PathfinderPanel";
import { AlignPanel } from "./AlignPanel";
import { TransformPanel } from "./TransformPanel";
import { EffectsPanel } from "./EffectsPanel";
import { StylesPanel } from "./StylesPanel";
import { TextTools } from "./TextTools";
import { ChartGenerator } from "./ChartGenerator";
import { PDFExporter } from "./PDFExporter";
import { FontRecognizer } from "./FontRecognizer";
import { AIDesignAssistant } from "./AIDesignAssistant";
import { AppearancePanel } from "./AppearancePanel";
import { LayersPanelPro } from "./LayersPanelPro";
import { BlendModePanel } from "./BlendModePanel";
import { PenToolPro } from "./PenToolPro";
import { CharacterPanel } from "./CharacterPanel";
import { ParagraphPanel } from "./ParagraphPanel";
import { PathTextTool } from "./PathTextTool";
import { ArtboardPanel } from "./ArtboardPanel";
import { BrushPanelPro } from "./BrushPanelPro";
import { WarpTransformPanel } from "./WarpTransformPanel";
import { DEFAULT_FONTS } from "./types";
import {
  Layers,
  Palette,
  Blend,
  Box,
  AlignCenter,
  Move3D,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Type,
  BarChart3,
  Wand2,
  FileText,
  ScanSearch,
  Bot,
  Home,
  X,
} from "lucide-react";

// 动态导入画布组件
const CanvasEditorPro = dynamic(() => import("./CanvasEditorPro"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-100">
      <div className="text-gray-400">加载画布中...</div>
    </div>
  ),
});

// 可折叠面板组件
interface CollapsiblePanelProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  icon,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 transition-colors text-gray-300"
      >
        {isOpen ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span className="text-gray-400">{icon}</span>
        <span className="text-xs font-medium">{title}</span>
      </button>
      {isOpen && <div className="px-2 pb-2 bg-gray-850">{children}</div>}
    </div>
  );
};

// 图层面板组件
const LayersPanel: React.FC = () => {
  const {
    layers,
    selectedLayerId,
    setSelectedLayerId,
    toggleLayerVisibility,
    toggleLayerLock,
    deleteLayer,
    duplicateLayer,
    renameLayer,
  } = useEditorStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameLayer(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="p-2">
      {layers.length === 0 ? (
        <div className="text-xs text-gray-500 text-center py-4">没有对象</div>
      ) : (
        <div className="space-y-1">
          {layers.map((layer) => (
            <div
              key={layer.id}
              onClick={() => setSelectedLayerId(layer.id)}
              className={`
                group flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer text-xs
                ${selectedLayerId === layer.id ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"}
              `}
            >
              {/* 可见性 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                className="p-0.5 hover:bg-gray-600 rounded"
              >
                {layer.visible ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3 text-gray-500" />
                )}
              </button>

              {/* 锁定 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerLock(layer.id);
                }}
                className="p-0.5 hover:bg-gray-600 rounded"
              >
                {layer.locked ? (
                  <Lock className="w-3 h-3 text-orange-400" />
                ) : (
                  <Unlock className="w-3 h-3 text-gray-500" />
                )}
              </button>

              {/* 名称 */}
              {editingId === layer.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleRename(layer.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(layer.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
                  autoFocus
                />
              ) : (
                <span
                  className="flex-1 truncate"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingId(layer.id);
                    setEditName(layer.name);
                  }}
                >
                  {layer.name}
                </span>
              )}

              {/* 操作按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateLayer(layer.id);
                }}
                className="p-0.5 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100"
                title="复制"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteLayer(layer.id);
                }}
                className="p-0.5 hover:bg-red-900 rounded text-red-400 opacity-0 group-hover:opacity-100"
                title="删除"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 属性面板组件
const PropertiesPanel: React.FC = () => {
  const { activeObject, canvas, addToHistory } = useEditorStore();

  // 使用本地状态跟踪属性值
  const [localFill, setLocalFill] = useState("#000000");
  const [localStroke, setLocalStroke] = useState("#000000");
  const [localStrokeWidth, setLocalStrokeWidth] = useState(0);
  const [localOpacity, setLocalOpacity] = useState(100);
  const [localFontFamily, setLocalFontFamily] = useState("宋体");
  const [localFontSize, setLocalFontSize] = useState(24);

  // 同步 activeObject 属性到本地状态
  React.useEffect(() => {
    if (activeObject) {
      const fill = activeObject.fill;
      setLocalFill(typeof fill === "string" ? fill : "#000000");
      setLocalStroke(
        typeof activeObject.stroke === "string"
          ? activeObject.stroke
          : "#000000",
      );
      setLocalStrokeWidth(activeObject.strokeWidth || 0);
      setLocalOpacity((activeObject.opacity || 1) * 100);

      // 文字属性
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textObj = activeObject as any;
      if (activeObject.type === "i-text" || activeObject.type === "textbox") {
        setLocalFontFamily(textObj.fontFamily || "宋体");
        setLocalFontSize(textObj.fontSize || 24);
      }
    }
  }, [activeObject]);

  if (!activeObject) {
    return (
      <div className="p-4 text-xs text-gray-500 text-center">
        选择一个对象以查看属性
      </div>
    );
  }

  const handleChange = (prop: string, value: unknown) => {
    if (!canvas || !activeObject) return;
    activeObject.set(prop as keyof fabric.Object, value);
    canvas.renderAll();
  };

  const handleCommit = () => {
    if (canvas) {
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  };

  return (
    <div className="p-3 space-y-3">
      {/* 填充色 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-10">填充</span>
        <input
          type="color"
          value={localFill}
          onChange={(e) => {
            setLocalFill(e.target.value);
            handleChange("fill", e.target.value);
          }}
          onBlur={handleCommit}
          className="w-7 h-6 rounded cursor-pointer bg-gray-700 border border-gray-600"
        />
        <button
          onClick={() => {
            setLocalFill("transparent");
            handleChange("fill", "transparent");
            handleCommit();
          }}
          className="text-xs text-gray-500 hover:text-white"
        >
          无
        </button>
      </div>

      {/* 描边色 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-10">描边</span>
        <input
          type="color"
          value={localStroke}
          onChange={(e) => {
            setLocalStroke(e.target.value);
            handleChange("stroke", e.target.value);
          }}
          onBlur={handleCommit}
          className="w-7 h-6 rounded cursor-pointer bg-gray-700 border border-gray-600"
        />
        <input
          type="number"
          min="0"
          max="50"
          value={localStrokeWidth}
          onChange={(e) => {
            const val = Number(e.target.value);
            setLocalStrokeWidth(val);
            handleChange("strokeWidth", val);
          }}
          onBlur={handleCommit}
          className="w-12 text-xs bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
        />
        <span className="text-xs text-gray-500">px</span>
      </div>

      {/* 不透明度 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-10">透明</span>
        <input
          type="range"
          min="0"
          max="100"
          value={localOpacity}
          onChange={(e) => {
            const val = Number(e.target.value);
            setLocalOpacity(val);
            handleChange("opacity", val / 100);
          }}
          onMouseUp={handleCommit}
          className="flex-1 accent-blue-500"
        />
        <span className="text-xs text-gray-400 w-8 text-right">
          {Math.round(localOpacity)}%
        </span>
      </div>

      {/* 文字属性 */}
      {(activeObject.type === "i-text" || activeObject.type === "textbox") && (
        <div className="pt-3 border-t border-gray-700 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-10">字体</span>
            <select
              value={localFontFamily}
              onChange={(e) => {
                setLocalFontFamily(e.target.value);
                handleChange("fontFamily", e.target.value);
                handleCommit();
              }}
              className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-1 py-1 text-white"
            >
              {DEFAULT_FONTS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-10">字号</span>
            <input
              type="number"
              min="8"
              max="200"
              value={localFontSize}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLocalFontSize(val);
                handleChange("fontSize", val);
              }}
              onBlur={handleCommit}
              className="w-14 text-xs bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// 左侧面板标签项类型
type LeftPanelTab = "design" | "tools" | "advanced";

// 主编辑器组件
export const ImageEditorPro: React.FC = () => {
  const { canvasWidth, canvasHeight, zoom } = useEditorStore();

  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>("design");
  const [activeTab, setActiveTab] = useState<"properties" | "layers">(
    "properties",
  );

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* 顶部栏 */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-2">
        {/* 左侧 - 返回按钮和Logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="返回首页"
          >
            <Home className="w-4 h-4" />
          </Link>
          <div className="h-5 w-px bg-gray-600" />
          <span className="text-sm font-semibold text-white">Vector Pro</span>
        </div>

        {/* 中间 - 菜单栏 */}
        <div className="flex-1 flex justify-center">
          <MenuBar />
        </div>

        {/* 右侧 - 画布信息 */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>
            {canvasWidth} × {canvasHeight}
          </span>
          <span>{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧工具栏 */}
        <ToolbarPro />

        {/* 左侧面板 */}
        {leftPanelOpen ? (
          <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
            {/* 面板标签 */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setLeftPanelTab("design")}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                  leftPanelTab === "design"
                    ? "text-blue-400 bg-gray-700"
                    : "text-gray-400 hover:text-white hover:bg-gray-750"
                }`}
              >
                设计
              </button>
              <button
                onClick={() => setLeftPanelTab("tools")}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                  leftPanelTab === "tools"
                    ? "text-blue-400 bg-gray-700"
                    : "text-gray-400 hover:text-white hover:bg-gray-750"
                }`}
              >
                工具
              </button>
              <button
                onClick={() => setLeftPanelTab("advanced")}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                  leftPanelTab === "advanced"
                    ? "text-blue-400 bg-gray-700"
                    : "text-gray-400 hover:text-white hover:bg-gray-750"
                }`}
              >
                高级
              </button>
              <button
                onClick={() => setLeftPanelOpen(false)}
                className="px-2 text-gray-500 hover:text-white hover:bg-gray-700"
                title="关闭面板"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* 面板内容 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {leftPanelTab === "design" && (
                <>
                  <CollapsiblePanel
                    title="颜色"
                    icon={<Palette className="w-4 h-4" />}
                  >
                    <ColorPanel />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="渐变"
                    icon={<Blend className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <GradientEditor />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="效果"
                    icon={<Wand2 className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <EffectsPanel />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="样式"
                    icon={<Sparkles className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <StylesPanel />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="外观"
                    icon={<Layers className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <AppearancePanel />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="混合模式"
                    icon={<Blend className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <BlendModePanel />
                  </CollapsiblePanel>
                </>
              )}

              {leftPanelTab === "tools" && (
                <>
                  <CollapsiblePanel
                    title="路径查找器"
                    icon={<Box className="w-4 h-4" />}
                  >
                    <PathfinderPanel />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="对齐"
                    icon={<AlignCenter className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <AlignPanel />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="变换"
                    icon={<Move3D className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <TransformPanel />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="文字工具"
                    icon={<Type className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <TextTools />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="字符"
                    icon={<Type className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <CharacterPanel />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="段落"
                    icon={<AlignCenter className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <ParagraphPanel />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="路径文字"
                    icon={<Type className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <PathTextTool />
                  </CollapsiblePanel>
                </>
              )}

              {leftPanelTab === "advanced" && (
                <>
                  <CollapsiblePanel
                    title="数据图表"
                    icon={<BarChart3 className="w-4 h-4" />}
                  >
                    <ChartGenerator />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="PDF 导入/导出"
                    icon={<FileText className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <PDFExporter />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="字体识别"
                    icon={<ScanSearch className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <FontRecognizer />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="AI 设计助手"
                    icon={<Bot className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <AIDesignAssistant />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="画板"
                    icon={<Layers className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <ArtboardPanel />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="画笔"
                    icon={<Palette className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <BrushPanelPro />
                  </CollapsiblePanel>

                  <CollapsiblePanel
                    title="变形"
                    icon={<Move3D className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <WarpTransformPanel />
                  </CollapsiblePanel>
                </>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setLeftPanelOpen(true)}
            className="w-8 bg-gray-800 border-r border-gray-700 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-700"
            title="打开面板"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* 画布区域 */}
        <CanvasEditorPro width={canvasWidth} height={canvasHeight} />

        {/* 右侧面板 */}
        {rightPanelOpen ? (
          <div className="w-56 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* 面板标签 */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab("properties")}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                  activeTab === "properties"
                    ? "text-blue-400 bg-gray-700"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                属性
              </button>
              <button
                onClick={() => setActiveTab("layers")}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                  activeTab === "layers"
                    ? "text-blue-400 bg-gray-700"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                图层
              </button>
              <button
                onClick={() => setRightPanelOpen(false)}
                className="px-2 text-gray-500 hover:text-white hover:bg-gray-700"
                title="关闭面板"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>

            {/* 面板内容 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeTab === "properties" && <PropertiesPanel />}
              {activeTab === "layers" && <LayersPanelPro />}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setRightPanelOpen(true)}
            className="w-8 bg-gray-800 border-l border-gray-700 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-700"
            title="打开面板"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 自定义滚动条样式 */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default ImageEditorPro;
