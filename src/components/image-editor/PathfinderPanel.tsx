"use client";

import React from "react";
import { useEditorStore } from "@/store/editor-store";
import type { PathfinderOperation } from "./types";

interface PathfinderButtonProps {
  operation: PathfinderOperation;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const PathfinderButton: React.FC<PathfinderButtonProps> = ({
  operation,
  icon,
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-2 hover:bg-gray-600 rounded transition-colors text-gray-400 hover:text-white"
    title={label}
  >
    <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
    <span className="text-[9px] text-gray-500 mt-1">{label}</span>
  </button>
);

// SVG图标组件
const UniteIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M4 4h10v10H4V4zm6 6h10v10H10V10z" fillOpacity="0.3" />
    <path
      d="M4 4h10v6H10v4H4V4zm6 6v4h4V10h-4zm0 4h4v6h-4v-6zm4-4h6v10h-6V10z"
      fill="currentColor"
    />
  </svg>
);

const MinusFrontIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M4 4h10v10H4V4z" fill="currentColor" />
    <path
      d="M10 10h10v10H10V10z"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
  </svg>
);

const MinusBackIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path
      d="M4 4h10v10H4V4z"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
    <path d="M10 10h10v10H10V10z" fill="currentColor" />
  </svg>
);

const IntersectIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path
      d="M4 4h10v10H4V4z"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="1"
    />
    <path
      d="M10 10h10v10H10V10z"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="1"
    />
    <path d="M10 10h4v4h-4v-4z" fill="currentColor" />
  </svg>
);

const ExcludeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M4 4h6v6h4V4h4v10H10v4H4V4z" fill="currentColor" />
    <path d="M14 14h6v6h-6v-6z" fill="currentColor" />
  </svg>
);

const DivideIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M4 4h6v6H4V4z" fill="currentColor" />
    <path d="M10 4h4v6h-4V4z" fillOpacity="0.7" />
    <path d="M4 10h6v4H4v-4z" fillOpacity="0.5" />
    <path d="M10 10h4v4h-4v-4z" fillOpacity="0.3" />
    <path d="M14 10h6v10h-6V10z" fill="currentColor" />
    <path d="M10 14h4v6h-4v-6z" fillOpacity="0.5" />
  </svg>
);

const TrimIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M4 4h6v10H4V4z" fill="currentColor" />
    <path d="M10 4h4v6h-4V4z" fillOpacity="0.3" />
    <path
      d="M10 10h10v10H10V10z"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
  </svg>
);

const MergeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M4 4h10v6H10v4H4V4z" fill="currentColor" />
    <path d="M10 10h10v10H10V10z" fill="currentColor" />
  </svg>
);

const CropIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <rect
      x="4"
      y="4"
      width="10"
      height="10"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeWidth="1"
    />
    <rect x="10" y="10" width="4" height="4" fill="currentColor" />
  </svg>
);

const OutlineIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="4" y="4" width="10" height="10" />
    <rect x="10" y="10" width="10" height="10" />
  </svg>
);

export const PathfinderPanel: React.FC = () => {
  const { pathfinderOperation, canvas } = useEditorStore();

  const handleOperation = (operation: PathfinderOperation) => {
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    if (!activeObj) {
      alert("请先选择至少两个对象");
      return;
    }

    pathfinderOperation(operation);
  };

  const operations: {
    operation: PathfinderOperation;
    icon: React.ReactNode;
    label: string;
  }[] = [
    { operation: "unite", icon: <UniteIcon />, label: "合并" },
    { operation: "minus_front", icon: <MinusFrontIcon />, label: "减去顶层" },
    { operation: "minus_back", icon: <MinusBackIcon />, label: "减去底层" },
    { operation: "intersect", icon: <IntersectIcon />, label: "相交" },
    { operation: "exclude", icon: <ExcludeIcon />, label: "差集" },
  ];

  const shapeOperations: {
    operation: PathfinderOperation;
    icon: React.ReactNode;
    label: string;
  }[] = [
    { operation: "divide", icon: <DivideIcon />, label: "分割" },
    { operation: "trim", icon: <TrimIcon />, label: "修剪" },
    { operation: "merge", icon: <MergeIcon />, label: "合并路径" },
    { operation: "crop", icon: <CropIcon />, label: "裁剪" },
    { operation: "outline", icon: <OutlineIcon />, label: "轮廓" },
  ];

  return (
    <div className="p-3">
      {/* 形状模式 */}
      <div className="mb-3">
        <span className="text-xs text-gray-500 block mb-2">形状模式</span>
        <div className="grid grid-cols-5 gap-1">
          {operations.map(({ operation, icon, label }) => (
            <PathfinderButton
              key={operation}
              operation={operation}
              icon={icon}
              label={label}
              onClick={() => handleOperation(operation)}
            />
          ))}
        </div>
      </div>

      {/* 路径查找器 */}
      <div>
        <span className="text-xs text-gray-500 block mb-2">路径查找器</span>
        <div className="grid grid-cols-5 gap-1">
          {shapeOperations.map(({ operation, icon, label }) => (
            <PathfinderButton
              key={operation}
              operation={operation}
              icon={icon}
              label={label}
              onClick={() => handleOperation(operation)}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700">
        <p className="text-[10px] text-gray-500">
          提示：选择多个对象后使用路径查找器进行布尔运算
        </p>
      </div>
    </div>
  );
};

export default PathfinderPanel;
