"use client";

import React, { useState } from "react";
import { useEditorStore } from "@/store/editor-store";
import {
  MousePointer2,
  Move,
  Pen,
  Pencil,
  Brush,
  Eraser,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Star,
  Minus,
  ArrowRight,
  Type,
  AlignLeft,
  Pipette,
  PaintBucket,
  Blend,
  Hand,
  ZoomIn,
  ChevronDown,
  Spline,
  LayoutGrid,
  Scissors,
  Box,
} from "lucide-react";
import type { ToolType } from "./types";
import { TOOL_TIPS } from "./types";

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  hasSubmenu?: boolean;
  onSubmenuClick?: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  tool,
  icon,
  label,
  active,
  onClick,
  hasSubmenu,
  onSubmenuClick,
}) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center w-8 h-8 rounded transition-all
        ${
          active
            ? "bg-blue-600 text-white"
            : "text-gray-400 hover:bg-gray-700 hover:text-white"
        }
      `}
      title={TOOL_TIPS[tool] || label}
    >
      {icon}
      {hasSubmenu && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onSubmenuClick?.();
          }}
          className="absolute bottom-0 right-0 w-3 h-3 flex items-center justify-center cursor-pointer"
        >
          <ChevronDown className="w-2 h-2" />
        </span>
      )}
    </button>
    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
      {TOOL_TIPS[tool] || label}
    </div>
  </div>
);

interface ToolGroupProps {
  title: string;
  children: React.ReactNode;
}

const ToolGroup: React.FC<ToolGroupProps> = ({ title, children }) => (
  <div className="mb-3">
    <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 px-0.5">
      {title}
    </div>
    <div className="flex flex-col gap-0.5">{children}</div>
  </div>
);

// 形状子菜单
interface ShapeSubmenuProps {
  onSelect: (tool: ToolType) => void;
  currentTool: ToolType;
}

const ShapeSubmenu: React.FC<ShapeSubmenuProps> = ({
  onSelect,
  currentTool,
}) => {
  const shapes: { tool: ToolType; icon: React.ReactNode; label: string }[] = [
    { tool: "rectangle", icon: <Square className="w-4 h-4" />, label: "矩形" },
    {
      tool: "roundedRect",
      icon: <Box className="w-4 h-4" />,
      label: "圆角矩形",
    },
    { tool: "ellipse", icon: <Circle className="w-4 h-4" />, label: "椭圆" },
    { tool: "circle", icon: <Circle className="w-4 h-4" />, label: "正圆" },
    { tool: "polygon", icon: <Hexagon className="w-4 h-4" />, label: "多边形" },
    { tool: "star", icon: <Star className="w-4 h-4" />, label: "星形" },
  ];

  return (
    <div className="absolute left-full top-0 ml-1 bg-gray-700 rounded-lg shadow-xl border border-gray-600 p-2 z-50">
      <div className="grid grid-cols-3 gap-1">
        {shapes.map(({ tool, icon, label }) => (
          <button
            key={tool}
            onClick={() => onSelect(tool)}
            className={`
              flex flex-col items-center justify-center p-2 rounded transition-all
              ${currentTool === tool ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-600"}
            `}
            title={label}
          >
            {icon}
            <span className="text-[10px] mt-1">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// 线条子菜单
const LineSubmenu: React.FC<ShapeSubmenuProps> = ({
  onSelect,
  currentTool,
}) => {
  const lines: { tool: ToolType; icon: React.ReactNode; label: string }[] = [
    { tool: "line", icon: <Minus className="w-4 h-4" />, label: "直线" },
    { tool: "polyline", icon: <Spline className="w-4 h-4" />, label: "折线" },
    { tool: "arrow", icon: <ArrowRight className="w-4 h-4" />, label: "箭头" },
    {
      tool: "arc",
      icon: <Spline className="w-4 h-4 rotate-45" />,
      label: "弧线",
    },
    {
      tool: "spiral",
      icon: <Spline className="w-4 h-4 rotate-90" />,
      label: "螺旋",
    },
  ];

  return (
    <div className="absolute left-full top-0 ml-1 bg-gray-700 rounded-lg shadow-xl border border-gray-600 p-2 z-50">
      <div className="grid grid-cols-2 gap-1">
        {lines.map(({ tool, icon, label }) => (
          <button
            key={tool}
            onClick={() => onSelect(tool)}
            className={`
              flex flex-col items-center justify-center p-2 rounded transition-all
              ${currentTool === tool ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-600"}
            `}
            title={label}
          >
            {icon}
            <span className="text-[10px] mt-1">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// 文字子菜单
const TextSubmenu: React.FC<ShapeSubmenuProps> = ({
  onSelect,
  currentTool,
}) => {
  const textTools: { tool: ToolType; icon: React.ReactNode; label: string }[] =
    [
      { tool: "text", icon: <Type className="w-4 h-4" />, label: "点文字" },
      {
        tool: "areaText",
        icon: <AlignLeft className="w-4 h-4" />,
        label: "区域文字",
      },
      {
        tool: "pathText",
        icon: <Spline className="w-4 h-4" />,
        label: "路径文字",
      },
    ];

  return (
    <div className="absolute left-full top-0 ml-1 bg-gray-700 rounded-lg shadow-xl border border-gray-600 p-2 z-50">
      <div className="flex flex-col gap-1">
        {textTools.map(({ tool, icon, label }) => (
          <button
            key={tool}
            onClick={() => onSelect(tool)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded transition-all text-sm
              ${currentTool === tool ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-600"}
            `}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const ToolbarPro: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    foregroundColor,
    backgroundColor,
    swapColors,
  } = useEditorStore();
  const [showShapeSubmenu, setShowShapeSubmenu] = useState(false);
  const [showLineSubmenu, setShowLineSubmenu] = useState(false);
  const [showTextSubmenu, setShowTextSubmenu] = useState(false);

  const shapeTools: ToolType[] = [
    "rectangle",
    "roundedRect",
    "ellipse",
    "circle",
    "polygon",
    "star",
  ];
  const lineTools: ToolType[] = ["line", "polyline", "arc", "spiral"];
  const textTools: ToolType[] = ["text", "areaText", "pathText"];

  const currentShapeTool = shapeTools.includes(activeTool)
    ? activeTool
    : "rectangle";
  const currentLineTool = lineTools.includes(activeTool) ? activeTool : "line";
  const currentTextTool = textTools.includes(activeTool) ? activeTool : "text";

  const getShapeIcon = () => {
    switch (currentShapeTool) {
      case "rectangle":
        return <Square className="w-5 h-5" />;
      case "roundedRect":
        return <Box className="w-5 h-5" />;
      case "ellipse":
      case "circle":
        return <Circle className="w-5 h-5" />;
      case "polygon":
        return <Hexagon className="w-5 h-5" />;
      case "star":
        return <Star className="w-5 h-5" />;
      default:
        return <Square className="w-5 h-5" />;
    }
  };

  const getLineIcon = () => {
    switch (currentLineTool) {
      case "line":
        return <Minus className="w-5 h-5" />;
      case "arrow":
        return <ArrowRight className="w-5 h-5" />;
      default:
        return <Spline className="w-5 h-5" />;
    }
  };

  const getTextIcon = () => {
    switch (currentTextTool) {
      case "text":
        return <Type className="w-5 h-5" />;
      case "areaText":
        return <AlignLeft className="w-5 h-5" />;
      case "pathText":
        return <Spline className="w-5 h-5" />;
      default:
        return <Type className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-12 bg-gray-800 border-r border-gray-700 flex flex-col py-2 px-1.5 overflow-y-auto">
      {/* 选择工具 */}
      <ToolGroup title="选择">
        <ToolButton
          tool="directSelect"
          icon={<Move className="w-5 h-5" />}
          label="拖动移动"
          active={activeTool === "directSelect"}
          onClick={() => setActiveTool("directSelect")}
        />
        <ToolButton
          tool="select"
          icon={<MousePointer2 className="w-5 h-5" />}
          label="双击选层"
          active={activeTool === "select"}
          onClick={() => setActiveTool("select")}
        />
      </ToolGroup>

      {/* 绘制工具 */}
      <ToolGroup title="绘制">
        <ToolButton
          tool="pen"
          icon={<Pen className="w-5 h-5" />}
          label="钢笔"
          active={activeTool === "pen"}
          onClick={() => setActiveTool("pen")}
        />
        <ToolButton
          tool="pencil"
          icon={<Pencil className="w-5 h-5" />}
          label="铅笔"
          active={activeTool === "pencil"}
          onClick={() => setActiveTool("pencil")}
        />
        <ToolButton
          tool="brush"
          icon={<Brush className="w-5 h-5" />}
          label="画笔"
          active={activeTool === "brush"}
          onClick={() => setActiveTool("brush")}
        />
        <ToolButton
          tool="eraser"
          icon={<Eraser className="w-5 h-5" />}
          label="橡皮擦"
          active={activeTool === "eraser"}
          onClick={() => setActiveTool("eraser")}
        />
      </ToolGroup>

      {/* 形状工具 */}
      <ToolGroup title="形状">
        <div className="relative">
          <ToolButton
            tool={currentShapeTool}
            icon={getShapeIcon()}
            label="形状"
            active={shapeTools.includes(activeTool)}
            onClick={() => setActiveTool(currentShapeTool)}
            hasSubmenu
            onSubmenuClick={() => setShowShapeSubmenu(!showShapeSubmenu)}
          />
          {showShapeSubmenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowShapeSubmenu(false)}
              />
              <ShapeSubmenu
                onSelect={(tool) => {
                  setActiveTool(tool);
                  setShowShapeSubmenu(false);
                }}
                currentTool={activeTool}
              />
            </>
          )}
        </div>

        <div className="relative">
          <ToolButton
            tool={currentLineTool}
            icon={getLineIcon()}
            label="线条"
            active={lineTools.includes(activeTool)}
            onClick={() => setActiveTool(currentLineTool)}
            hasSubmenu
            onSubmenuClick={() => setShowLineSubmenu(!showLineSubmenu)}
          />
          {showLineSubmenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowLineSubmenu(false)}
              />
              <LineSubmenu
                onSelect={(tool) => {
                  setActiveTool(tool);
                  setShowLineSubmenu(false);
                }}
                currentTool={activeTool}
              />
            </>
          )}
        </div>

        {/* 独立的箭头工具按钮 */}
        <ToolButton
          tool="arrow"
          icon={<ArrowRight className="w-5 h-5" />}
          label="箭头"
          active={activeTool === "arrow"}
          onClick={() => setActiveTool("arrow")}
        />
      </ToolGroup>

      {/* 文字工具 */}
      <ToolGroup title="文字">
        <div className="relative">
          <ToolButton
            tool={currentTextTool}
            icon={getTextIcon()}
            label="文字"
            active={textTools.includes(activeTool)}
            onClick={() => setActiveTool(currentTextTool)}
            hasSubmenu
            onSubmenuClick={() => setShowTextSubmenu(!showTextSubmenu)}
          />
          {showTextSubmenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowTextSubmenu(false)}
              />
              <TextSubmenu
                onSelect={(tool) => {
                  setActiveTool(tool);
                  setShowTextSubmenu(false);
                }}
                currentTool={activeTool}
              />
            </>
          )}
        </div>
      </ToolGroup>

      {/* 颜色工具 */}
      <ToolGroup title="颜色">
        <ToolButton
          tool="eyedropper"
          icon={<Pipette className="w-5 h-5" />}
          label="吸管"
          active={activeTool === "eyedropper"}
          onClick={() => setActiveTool("eyedropper")}
        />
      </ToolGroup>

      {/* 视图工具 */}
      <ToolGroup title="视图">
        <ToolButton
          tool="hand"
          icon={<Hand className="w-5 h-5" />}
          label="抓手"
          active={activeTool === "hand"}
          onClick={() => setActiveTool("hand")}
        />
        <ToolButton
          tool="zoom"
          icon={<ZoomIn className="w-5 h-5" />}
          label="缩放"
          active={activeTool === "zoom"}
          onClick={() => setActiveTool("zoom")}
        />
      </ToolGroup>

      {/* 颜色选择器 */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 px-1">
          颜色
        </div>
        <div className="relative w-10 h-10 mx-auto">
          {/* 背景色 */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 rounded border-2 border-white shadow cursor-pointer"
            style={{ backgroundColor: backgroundColor }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "color";
              input.value = backgroundColor;
              input.onchange = (e) => {
                useEditorStore
                  .getState()
                  .setBackgroundColor((e.target as HTMLInputElement).value);
              };
              input.click();
            }}
            title="背景色"
          />
          {/* 前景色 */}
          <div
            className="absolute top-0 left-0 w-6 h-6 rounded border-2 border-white shadow cursor-pointer z-10"
            style={{ backgroundColor: foregroundColor }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "color";
              input.value = foregroundColor;
              input.onchange = (e) => {
                useEditorStore
                  .getState()
                  .setForegroundColor((e.target as HTMLInputElement).value);
              };
              input.click();
            }}
            title="前景色"
          />
          {/* 交换按钮 */}
          <button
            onClick={swapColors}
            className="absolute -top-1 -right-1 w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 z-20"
            title="交换前景色和背景色"
          >
            <svg
              className="w-2.5 h-2.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolbarPro;
