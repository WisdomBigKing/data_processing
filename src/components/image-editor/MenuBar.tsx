"use client";

import React, { useState, useRef, useEffect } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/store/editor-store";
import {
  FileDown,
  FileUp,
  Save,
  Undo2,
  Redo2,
  Copy,
  Clipboard,
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Ruler,
  Layers,
  PanelRight,
  Settings,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

interface MenuItemProps {
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  shortcut,
  icon,
  onClick,
  disabled,
  divider,
}) => {
  if (divider) {
    return <div className="h-px bg-gray-600 my-1" />;
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left
        ${disabled ? "text-gray-500 cursor-not-allowed" : "hover:bg-gray-600 text-gray-200"}
      `}
    >
      <span className="w-4 h-4 flex items-center justify-center text-gray-400">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-xs text-gray-500">{shortcut}</span>}
    </button>
  );
};

interface DropdownMenuProps {
  label: string;
  items: MenuItemProps[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  label,
  items,
  isOpen,
  onToggle,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={onToggle}
        className={`px-3 py-1 text-xs hover:bg-gray-700 rounded text-gray-300 ${isOpen ? "bg-gray-700" : ""}`}
      >
        {label}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-gray-700 rounded shadow-xl border border-gray-600 py-1 z-50">
          {items.map((item, index) => (
            <MenuItem
              key={index}
              {...item}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const MenuBar: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const {
    canvas,
    undo,
    redo,
    history,
    historyIndex,
    zoom,
    setZoom,
    toggleGrid,
    toggleRulers,
    toggleSmartGuides,
    grid,
    showRulers,
    smartGuidesEnabled,
    groupSelected,
    ungroupSelected,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    flipHorizontal,
    flipVertical,
    addToHistory,
    updateLayers,
  } = useEditorStore();

  const handleToggle = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleClose = () => {
    setOpenMenu(null);
  };

  const handleCopy = async () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      const cloned = await activeObj.clone();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__clipboard = cloned;
    }
  };

  const handlePaste = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clipboard = (window as any).__clipboard;
    if (!canvas || !clipboard) return;

    const cloned = await clipboard.clone();

    // 计算画布中心位置
    const canvasCenterX = canvas.width ? canvas.width / 2 : 400;
    const canvasCenterY = canvas.height ? canvas.height / 2 : 300;

    // 获取对象尺寸
    const objWidth = (cloned.width || 0) * (cloned.scaleX || 1);
    const objHeight = (cloned.height || 0) * (cloned.scaleY || 1);

    // 粘贴计数，用于偏移避免重叠
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pasteCount = ((window as any).__pasteCount || 0) + 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__pasteCount = pasteCount;

    const offset = (pasteCount % 10) * 20;

    cloned.set({
      left: canvasCenterX - objWidth / 2 + offset,
      top: canvasCenterY - objHeight / 2 + offset,
    });

    // 为粘贴的对象生成新ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cloned as any).id =
      `paste-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.renderAll();
    updateLayers();
    addToHistory(JSON.stringify(canvas.toJSON()));
  };

  const handleDelete = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      canvas.remove(activeObj);
      canvas.renderAll();
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
    }
  };

  const handleSelectAll = () => {
    if (!canvas) return;
    canvas.discardActiveObject();
    const objects = canvas.getObjects().filter((obj) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return !(obj as any).isGrid && !(obj as any).isGuide;
    });
    if (objects.length > 0) {
      const selection = new fabric.ActiveSelection(objects, { canvas });
      canvas.setActiveObject(selection);
      canvas.renderAll();
    }
  };

  const handleExportSVG = () => {
    if (!canvas) return;

    // 导出前先将所有group对象的子元素坐标转换为绝对坐标
    const objects = canvas.getObjects();
    const objectsToRestore: {
      obj: fabric.Object;
      originalProps: Record<string, unknown>;
    }[] = [];

    // 遍历所有对象，处理group
    objects.forEach((obj) => {
      if (obj.type === "group") {
        const group = obj as fabric.Group;
        const groupObjects = group.getObjects ? group.getObjects() : [];

        // 保存并重置group的变换
        objectsToRestore.push({
          obj: group,
          originalProps: {
            left: group.left,
            top: group.top,
            scaleX: group.scaleX,
            scaleY: group.scaleY,
            angle: group.angle,
          },
        });
      }
    });

    // 使用canvas.toSVG()时传入选项以保持正确的坐标
    const svg = canvas.toSVG({
      viewBox: {
        x: 0,
        y: 0,
        width: canvas.width || 800,
        height: canvas.height || 600,
      },
      width: `${canvas.width || 800}px`,
      height: `${canvas.height || 600}px`,
    });

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = () => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = "design.png";
    a.click();
  };

  // 检查对象是否为文字类型
  const isTextObject = (obj: fabric.FabricObject): boolean => {
    const type = obj.type?.toLowerCase() || "";
    if (type.includes("text")) return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyObj = obj as any;
    if (typeof anyObj.text === "string" && anyObj.text.length > 0) return true;
    if (
      obj instanceof fabric.Text ||
      obj instanceof fabric.IText ||
      obj instanceof fabric.Textbox
    ) {
      return true;
    }
    return false;
  };

  // 递归转换SVG中的文字元素为可编辑的IText
  const convertTextElements = (
    objects: fabric.FabricObject[],
  ): fabric.FabricObject[] => {
    return objects.map((obj) => {
      if (isTextObject(obj)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const textObj = obj as any;
        const textContent = textObj.text || textObj.textLines?.join("\n") || "";
        if (obj.type === "i-text") {
          textObj.id = `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          return obj;
        }
        const itext = new fabric.IText(textContent, {
          left: textObj.left,
          top: textObj.top,
          fontSize: textObj.fontSize || 16,
          fontFamily: textObj.fontFamily || "Arial",
          fill: textObj.fill || "#000000",
          fontWeight: textObj.fontWeight,
          fontStyle: textObj.fontStyle,
          textAlign: textObj.textAlign,
          angle: textObj.angle || 0,
          scaleX: textObj.scaleX || 1,
          scaleY: textObj.scaleY || 1,
          originX: textObj.originX || "left",
          originY: textObj.originY || "top",
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (itext as any).id =
          `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return itext;
      }
      if (obj.type === "group") {
        const group = obj as fabric.Group;
        const groupObjects = group.getObjects ? group.getObjects() : [];
        const convertedObjects = convertTextElements(groupObjects);
        group.remove(...groupObjects);
        convertedObjects.forEach((converted) => group.add(converted));
        return group;
      }
      return obj;
    });
  };

  const handleImportSVG = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svg,.ai";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !canvas) return;

      const text = await file.text();
      fabric.loadSVGFromString(text).then(({ objects, options }) => {
        if (objects.length > 0) {
          // 转换文字元素
          const filteredObjects = objects.filter(
            Boolean,
          ) as fabric.FabricObject[];
          const convertedObjects = convertTextElements(filteredObjects);

          const group = new fabric.Group(convertedObjects, {
            subTargetCheck: true,
          });

          // 使用SVG原始尺寸信息
          const svgWidth = options?.width || group.width || 1;
          const svgHeight = options?.height || group.height || 1;
          const canvasW = canvas.width || 800;
          const canvasH = canvas.height || 600;

          // 计算缩放比例
          const scaleX = canvasW / svgWidth;
          const scaleY = canvasH / svgHeight;
          const scale = Math.min(scaleX, scaleY, 1); // 不超过原始大小

          group.scale(scale);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (group as any).id = `svg-${Date.now()}`;

          canvas.add(group);
          canvas.centerObject(group);
          canvas.setActiveObject(group);
          canvas.renderAll();
          updateLayers();
          addToHistory(JSON.stringify(canvas.toJSON()));

          useEditorStore.getState().setActiveTool("directSelect");
        }
      });
    };
    input.click();
  };

  const fileMenuItems: MenuItemProps[] = [
    {
      label: "导入 SVG...",
      icon: <FileUp className="w-4 h-4" />,
      onClick: handleImportSVG,
    },
    {
      label: "导入图片...",
      icon: <FileUp className="w-4 h-4" />,
      onClick: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file || !canvas) return;

          const reader = new FileReader();
          reader.onload = async (e) => {
            const dataUrl = e.target?.result as string;
            try {
              const img = await fabric.FabricImage.fromURL(dataUrl);

              // 获取画布尺寸
              const canvasWidth = canvas.width || 800;
              const canvasHeight = canvas.height || 600;
              const imgWidth = img.width || 1;
              const imgHeight = img.height || 1;

              // 计算缩放比例 - 完全适配画布（保持比例，居中显示）
              const scaleX = canvasWidth / imgWidth;
              const scaleY = canvasHeight / imgHeight;
              const scale = Math.min(scaleX, scaleY);

              // 始终缩放图片以适配画布
              img.scale(scale);

              // 添加图片并居中
              canvas.add(img);
              canvas.centerObject(img);
              canvas.setActiveObject(img);
              canvas.renderAll();
              updateLayers();
              addToHistory(JSON.stringify(canvas.toJSON()));

              // 导入图片后自动切换到拖动移动模式
              useEditorStore.getState().setActiveTool("directSelect");
            } catch (err) {
              console.error("Failed to load image:", err);
            }
          };
          reader.readAsDataURL(file);
        };
        input.click();
      },
    },
    { divider: true, label: "" },
    {
      label: "导出为 SVG",
      icon: <FileDown className="w-4 h-4" />,
      onClick: handleExportSVG,
      shortcut: "Ctrl+Shift+S",
    },
    {
      label: "导出为 PNG",
      icon: <FileDown className="w-4 h-4" />,
      onClick: handleExportPNG,
      shortcut: "Ctrl+E",
    },
    {
      label: "导出为 JPG",
      icon: <FileDown className="w-4 h-4" />,
      onClick: () => {
        if (!canvas) return;
        const dataURL = canvas.toDataURL({
          format: "jpeg",
          quality: 0.9,
          multiplier: 2,
        });
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = "design.jpg";
        a.click();
      },
    },
    { divider: true, label: "" },
    {
      label: "保存项目",
      icon: <Save className="w-4 h-4" />,
      shortcut: "Ctrl+S",
      onClick: () => {
        if (!canvas) return;
        const json = JSON.stringify(canvas.toJSON());
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "project.json";
        a.click();
        URL.revokeObjectURL(url);
      },
    },
    {
      label: "打开项目...",
      icon: <FileUp className="w-4 h-4" />,
      shortcut: "Ctrl+O",
      onClick: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file || !canvas) return;

          const text = await file.text();
          try {
            const json = JSON.parse(text);
            canvas.loadFromJSON(json, () => {
              canvas.renderAll();
              updateLayers();
              addToHistory(JSON.stringify(canvas.toJSON()));
            });
          } catch (err) {
            console.error("Failed to load project:", err);
          }
        };
        input.click();
      },
    },
  ];

  const editMenuItems: MenuItemProps[] = [
    {
      label: "撤销",
      icon: <Undo2 className="w-4 h-4" />,
      shortcut: "Ctrl+Z",
      onClick: undo,
      disabled: historyIndex <= 0,
    },
    {
      label: "重做",
      icon: <Redo2 className="w-4 h-4" />,
      shortcut: "Ctrl+Shift+Z",
      onClick: redo,
      disabled: historyIndex >= history.length - 1,
    },
    { divider: true, label: "" },
    {
      label: "剪切",
      icon: <Scissors className="w-4 h-4" />,
      shortcut: "Ctrl+X",
      onClick: async () => {
        await handleCopy();
        handleDelete();
      },
    },
    {
      label: "复制",
      icon: <Copy className="w-4 h-4" />,
      shortcut: "Ctrl+C",
      onClick: handleCopy,
    },
    {
      label: "粘贴",
      icon: <Clipboard className="w-4 h-4" />,
      shortcut: "Ctrl+V",
      onClick: handlePaste,
    },
    {
      label: "删除",
      icon: <Trash2 className="w-4 h-4" />,
      shortcut: "Delete",
      onClick: handleDelete,
    },
    { divider: true, label: "" },
    { label: "全选", shortcut: "Ctrl+A", onClick: handleSelectAll },
  ];

  const objectMenuItems: MenuItemProps[] = [
    { label: "编组", shortcut: "Ctrl+G", onClick: groupSelected },
    { label: "取消编组", shortcut: "Ctrl+Shift+G", onClick: ungroupSelected },
    { divider: true, label: "" },
    { label: "置于顶层", shortcut: "Ctrl+Shift+]", onClick: bringToFront },
    { label: "上移一层", shortcut: "Ctrl+]", onClick: bringForward },
    { label: "下移一层", shortcut: "Ctrl+[", onClick: sendBackward },
    { label: "置于底层", shortcut: "Ctrl+Shift+[", onClick: sendToBack },
    { divider: true, label: "" },
    { label: "水平翻转", onClick: flipHorizontal },
    { label: "垂直翻转", onClick: flipVertical },
  ];

  const viewMenuItems: MenuItemProps[] = [
    {
      label: "放大",
      icon: <ZoomIn className="w-4 h-4" />,
      shortcut: "Ctrl++",
      onClick: () => setZoom(zoom * 1.25),
    },
    {
      label: "缩小",
      icon: <ZoomOut className="w-4 h-4" />,
      shortcut: "Ctrl+-",
      onClick: () => setZoom(zoom * 0.8),
    },
    {
      label: "适合窗口",
      icon: <Maximize className="w-4 h-4" />,
      shortcut: "Ctrl+0",
      onClick: () => setZoom(1),
    },
    { label: "实际大小", shortcut: "Ctrl+1", onClick: () => setZoom(1) },
    { divider: true, label: "" },
    {
      label: grid.showGrid ? "✓ 显示网格" : "显示网格",
      icon: <Grid3X3 className="w-4 h-4" />,
      onClick: toggleGrid,
    },
    {
      label: showRulers ? "✓ 显示标尺" : "显示标尺",
      icon: <Ruler className="w-4 h-4" />,
      onClick: toggleRulers,
    },
    {
      label: smartGuidesEnabled ? "✓ 智能参考线" : "智能参考线",
      onClick: toggleSmartGuides,
    },
  ];

  return (
    <div className="h-10 bg-white border-b border-gray-200 flex items-center px-2 gap-1">
      <div className="flex items-center gap-1 mr-4">
        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
          <span className="text-white text-xs font-bold">V</span>
        </div>
        <span className="font-semibold text-sm text-gray-700">Vector Pro</span>
      </div>

      <DropdownMenu
        label="文件"
        items={fileMenuItems}
        isOpen={openMenu === "file"}
        onToggle={() => handleToggle("file")}
        onClose={handleClose}
      />
      <DropdownMenu
        label="编辑"
        items={editMenuItems}
        isOpen={openMenu === "edit"}
        onToggle={() => handleToggle("edit")}
        onClose={handleClose}
      />
      <DropdownMenu
        label="对象"
        items={objectMenuItems}
        isOpen={openMenu === "object"}
        onToggle={() => handleToggle("object")}
        onClose={handleClose}
      />
      <DropdownMenu
        label="视图"
        items={viewMenuItems}
        isOpen={openMenu === "view"}
        onToggle={() => handleToggle("view")}
        onClose={handleClose}
      />

      <div className="flex-1" />

      {/* 缩放控制 */}
      <div className="flex items-center gap-2 mr-4">
        <button
          onClick={() => setZoom(zoom * 0.8)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-600 w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(zoom * 1.25)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MenuBar;
