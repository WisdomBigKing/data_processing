"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/store/editor-store";
import { v4 as uuidv4 } from "uuid";
import type { ToolType, AnchorPoint, Point } from "./types";

// 将任意颜色格式转换为 hex 格式
const toHexColor = (color: string): string => {
  if (!color) return "#000000";
  if (color.startsWith("#")) return color;

  // 处理 rgb/rgba 格式
  const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  return color;
};

interface CanvasEditorProProps {
  width?: number;
  height?: number;
}

export const CanvasEditorPro: React.FC<CanvasEditorProProps> = ({
  width = 800,
  height = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [tempObject, setTempObject] = useState<fabric.Object | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width, height });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  // 标志：是否刚刚双击进入了交互模式（防止handleSelection立即退出）
  const justEnteredInteractiveMode = useRef(false);

  const {
    canvas,
    setCanvas,
    activeTool,
    setActiveObject,
    zoom,
    setZoom,
    updateLayers,
    addToHistory,
    foregroundColor,
    backgroundColor,
    polygonSides,
    starPoints,
    starInnerRadius,
    cornerRadius,
    penToolState,
    addPenPoint,
    updatePenPreview,
    finishPenPath,
    setPenToolState,
    brushSettings,
    grid,
    guides,
    smartGuidesEnabled,
    showRulers,
  } = useEditorStore();

  // 初始化画布
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#ffffff",
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      // 允许选择group内的子对象
      subTargetCheck: true,
      // 交互式组选择
      fireRightClick: true,
      stopContextMenu: true,
    });

    // 配置画布
    fabricCanvas.selectionColor = "rgba(59, 130, 246, 0.1)";
    fabricCanvas.selectionBorderColor = "#3B82F6";
    fabricCanvas.selectionLineWidth = 1;

    // 双击选择图层 - 支持选中group内部的子元素（二级图层）
    fabricCanvas.on("mouse:dblclick", (opt) => {
      const currentTool = useEditorStore.getState().activeTool;

      // 【调试】打印完整的事件对象
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const optAny = opt as any;
      console.log(
        "[双击事件] opt.target:",
        opt.target?.type,
        "opt.subTargets:",
        optAny.subTargets,
      );

      // 【关键】检查是否点击了group内部的子元素
      const subTargets = optAny.subTargets as fabric.Object[] | undefined;
      const topTarget = opt.target;

      // 优先选择子元素（二级图层），如果没有则选择顶层对象（一级图层）
      let actualTarget: fabric.Object | null = null;

      // 如果点击的是group，尝试获取子元素
      if (topTarget && topTarget.type === "group") {
        const group = topTarget as fabric.Group;
        console.log(
          "[双击事件] 点击了group, subTargetCheck:",
          group.subTargetCheck,
          "子元素数量:",
          group.getObjects?.()?.length,
        );

        // 如果有subTargets，使用subTargets
        if (subTargets && subTargets.length > 0) {
          actualTarget = subTargets[subTargets.length - 1];
          console.log(
            "[双击事件] 使用subTargets选择子元素:",
            actualTarget.type,
          );
        } else {
          // subTargets为空，尝试通过鼠标位置手动查找子元素
          const e = opt.e as MouseEvent;
          const canvasEl = fabricCanvas.getElement();
          const rect = canvasEl.getBoundingClientRect();
          const pointer = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          };
          console.log("[双击事件] 鼠标位置:", pointer.x, pointer.y);

          // 将画布坐标转换为group内部坐标
          const groupObjects = group.getObjects ? group.getObjects() : [];
          const groupMatrix = group.calcTransformMatrix();
          const invertedMatrix = fabric.util.invertTransform(groupMatrix);
          const localPoint = fabric.util.transformPoint(
            new fabric.Point(pointer.x, pointer.y),
            invertedMatrix,
          );

          console.log("[双击事件] group内部坐标:", localPoint.x, localPoint.y);

          // 从后往前遍历（后面的在上层）
          for (let i = groupObjects.length - 1; i >= 0; i--) {
            const child = groupObjects[i];
            if (child.containsPoint(localPoint)) {
              actualTarget = child;
              console.log(
                "[双击事件] 手动查找到子元素:",
                child.type,
                "index:",
                i,
              );
              break;
            }
          }

          // 如果没找到子元素，选择整个group
          if (!actualTarget) {
            actualTarget = topTarget;
            console.log("[双击事件] 未找到子元素，选择整个group");
          }
        }
      } else if (subTargets && subTargets.length > 0) {
        // 非group但有subTargets
        actualTarget = subTargets[subTargets.length - 1];
        console.log(
          "[双击事件] 检测到子元素:",
          actualTarget.type,
          "父对象:",
          topTarget?.type,
        );
      } else if (topTarget) {
        // 没有子元素，选择顶层对象
        actualTarget = topTarget;
      }

      // 没有目标对象时直接返回
      if (!actualTarget) {
        console.log("[双击事件] 无目标对象");
        return;
      }

      console.log(
        "[双击事件] 触发, 实际目标:",
        actualTarget.type,
        "当前工具:",
        currentTool,
      );

      // 确保对象有 id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let targetId = (actualTarget as any).id;
      if (!targetId) {
        targetId = `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (actualTarget as any).id = targetId;
      }

      // 【关键步骤1】先清除当前选中状态
      fabricCanvas.discardActiveObject();

      // 【关键步骤2】处理group的交互模式
      const parentGroup = actualTarget.group;

      // 情况A：双击的是group内部的子元素
      if (parentGroup) {
        console.log("[双击事件] 子元素属于group，启用交互模式");

        // 设置标志，防止handleSelection立即退出交互模式
        justEnteredInteractiveMode.current = true;

        // 启用group的交互模式，允许操作子元素但保持group结构
        parentGroup.set({
          subTargetCheck: true,
          interactive: true,
        });

        // 启用所有子元素的可选择性
        const groupObjects = parentGroup.getObjects
          ? parentGroup.getObjects()
          : [];
        groupObjects.forEach((child) => {
          child.selectable = true;
          child.evented = true;
        });

        // 选中整个group
        fabricCanvas.setActiveObject(parentGroup);

        // 高亮显示当前子元素 - 使用选择边框而非描边，避免修改对象本身的样式
        actualTarget.set({
          borderColor: "#3B82F6",
          borderScaleFactor: 2,
          cornerColor: "#3B82F6",
          cornerStrokeColor: "#ffffff",
          cornerStyle: "circle",
          cornerSize: 10,
          transparentCorners: false,
        });

        fabricCanvas.requestRenderAll();

        // 更新图层面板选中状态为子元素
        useEditorStore.getState().setSelectedLayerId(targetId);
        useEditorStore.getState().setActiveObject(actualTarget);
        useEditorStore.getState().updateLayers();

        console.log("[双击事件] 已进入交互模式，选中子元素:", targetId);
        return;
      }

      // 情况B：双击的是一个group本身（不是子元素）
      if (actualTarget.type === "group") {
        console.log("[双击事件] 双击group，进入交互模式");

        // 设置标志，防止handleSelection立即退出交互模式
        justEnteredInteractiveMode.current = true;

        const group = actualTarget as fabric.Group;

        // 启用group的交互模式
        group.set({
          subTargetCheck: true,
          interactive: true,
        });

        // 启用所有子元素的可选择性
        const groupObjects = group.getObjects ? group.getObjects() : [];
        groupObjects.forEach((child) => {
          child.selectable = true;
          child.evented = true;
        });

        fabricCanvas.setActiveObject(group);
        fabricCanvas.requestRenderAll();

        // 更新状态
        useEditorStore.getState().setSelectedLayerId(targetId);
        useEditorStore.getState().setActiveObject(group);
        useEditorStore.getState().updateLayers();

        console.log("[双击事件] group已进入交互模式，可以选中子元素");
        return;
      }

      // 【关键步骤3】启用对象的可选择性
      actualTarget.selectable = true;
      actualTarget.evented = true;
      actualTarget.hasControls = true;
      actualTarget.hasBorders = true;

      // 【关键步骤4】设置明显的视觉样式 - 蓝色高亮边框 + 控制点
      actualTarget.set({
        borderColor: "#3B82F6",
        borderScaleFactor: 2,
        cornerColor: "#3B82F6",
        cornerStrokeColor: "#ffffff",
        cornerStyle: "circle",
        cornerSize: 12,
        transparentCorners: false,
        borderDashArray: undefined,
        padding: 5,
      });

      // 【关键步骤5】强制更新对象坐标
      actualTarget.setCoords();

      // 【关键步骤6】选中对象
      fabricCanvas.setActiveObject(actualTarget);

      // 【关键步骤7】立即渲染显示选中效果
      fabricCanvas.requestRenderAll();

      // 更新图层面板的选中状态
      useEditorStore.getState().setSelectedLayerId(targetId);

      // 同步更新 activeObject 到全局状态
      useEditorStore.getState().setActiveObject(actualTarget);

      // 更新图层列表确保UI同步
      useEditorStore.getState().updateLayers();

      console.log(
        "[双击事件] 已选中图层:",
        targetId,
        "类型:",
        actualTarget.type,
        "selectable:",
        actualTarget.selectable,
      );

      // 注意：无论是 select 还是 directSelect 模式，双击都只选中对象
      // 绝对不执行解组操作，以防止图片显示异常
    });

    setCanvas(fabricCanvas);

    // 初始历史记录
    addToHistory(JSON.stringify(fabricCanvas.toJSON()));

    return () => {
      fabricCanvas.dispose();
      setCanvas(null);
    };
  }, []);

  // 监听画布尺寸变化
  useEffect(() => {
    if (canvas) {
      canvas.setDimensions({ width, height });
      canvas.renderAll();
    }
  }, [canvas, width, height]);

  // 监听容器尺寸变化，自动调整画布大小以填充容器
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: containerWidth, height: containerHeight } =
          entry.contentRect;
        // 画布填充整个可用区域
        const newWidth = Math.floor(containerWidth);
        const newHeight = Math.floor(containerHeight);

        if (newWidth > 0 && newHeight > 0) {
          setCanvasDimensions({ width: newWidth, height: newHeight });

          // 同步更新 canvas 尺寸
          if (canvas) {
            canvas.setDimensions({ width: newWidth, height: newHeight });
            canvas.renderAll();
          }
        }
      }
    });

    resizeObserver.observe(canvasContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvas]);

  // 监听选择变化
  useEffect(() => {
    if (!canvas) return;

    const handleSelection = () => {
      const activeObj = canvas.getActiveObject();
      setActiveObject(activeObj || null);

      // 【关键】如果刚刚双击进入了交互模式，不要退出
      if (justEnteredInteractiveMode.current) {
        console.log("[选中事件] 刚刚进入交互模式，跳过退出逻辑");
        justEnteredInteractiveMode.current = false;
        return;
      }

      // 当单击选中一个group时，关闭其交互模式，恢复为整体拖动
      if (activeObj && activeObj.type === "group") {
        const group = activeObj as fabric.Group;
        // 关闭交互模式，使group变回整体可拖动
        group.set({
          interactive: false,
          subTargetCheck: true, // 保留subTargetCheck用于双击检测
        });
        // 重置所有子元素的样式（清除蓝色高亮）
        const groupObjects = group.getObjects ? group.getObjects() : [];
        groupObjects.forEach((child) => {
          child.selectable = false;
          child.evented = false;
        });
        canvas.requestRenderAll();
        console.log("[选中事件] group已退出交互模式，恢复整体拖动");
      }
    };

    const handleModified = () => {
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
    };

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", () => setActiveObject(null));
    canvas.on("object:modified", handleModified);
    canvas.on("object:added", updateLayers);
    canvas.on("object:removed", updateLayers);

    return () => {
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
      canvas.off("selection:cleared");
      canvas.off("object:modified", handleModified);
      canvas.off("object:added", updateLayers);
      canvas.off("object:removed", updateLayers);
    };
  }, [canvas]);

  // 配置工具模式
  useEffect(() => {
    if (!canvas) return;

    const isDrawMode = activeTool === "pencil" || activeTool === "brush";
    canvas.isDrawingMode = isDrawMode;

    // 确保 freeDrawingBrush 正确初始化
    if (isDrawMode) {
      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      }
      canvas.freeDrawingBrush.color = foregroundColor;
      canvas.freeDrawingBrush.width = brushSettings.size;
    }

    // directSelect: 拖动移动图片模式 - 单击即可选中并拖动
    // select: 双击选择图层模式 - 单击不可拖动，只有双击才能选中
    const isDirectSelect =
      activeTool === "directSelect" || activeTool === "lasso";
    const isSelectTool = activeTool === "select";

    // directSelect模式允许框选，select模式禁用框选
    canvas.selection = isDirectSelect;

    // 获取当前激活的对象（双击选中的对象不应被重置）
    const activeObj = canvas.getActiveObject();

    // 配置所有对象的可选择性
    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(obj as any).isPenPreview) {
        // 【关键】如果是当前激活的对象，保持其selectable=true（双击选中的对象）
        if (obj === activeObj) {
          obj.selectable = true;
          obj.evented = true;
          return;
        }
        // directSelect: 可选中可拖动
        // select: 不可直接选中（只能通过双击选中）
        obj.selectable = isDirectSelect;
        // 但都需要响应事件（用于双击检测）
        obj.evented =
          isDirectSelect ||
          isSelectTool ||
          activeTool === "eyedropper" ||
          activeTool === "paintBucket" ||
          activeTool === "eraser";
      }
    });

    // 设置画布光标 - 根据工具类型提供明确的视觉反馈
    switch (activeTool) {
      case "directSelect":
        // 拖动移动模式 - 使用移动光标
        canvas.defaultCursor = "move";
        canvas.hoverCursor = "move";
        break;
      case "select":
        // 双击选层模式 - 使用默认指针
        canvas.defaultCursor = "pointer";
        canvas.hoverCursor = "pointer";
        break;
      case "pen":
        canvas.defaultCursor = "crosshair";
        canvas.hoverCursor = "crosshair";
        break;
      case "pencil":
      case "brush":
        canvas.defaultCursor = "crosshair";
        canvas.hoverCursor = "crosshair";
        break;
      case "eyedropper":
        canvas.defaultCursor = "crosshair";
        canvas.hoverCursor = "crosshair";
        break;
      case "eraser":
        canvas.defaultCursor = "not-allowed";
        canvas.hoverCursor = "not-allowed";
        break;
      case "paintBucket":
        canvas.defaultCursor = "cell";
        canvas.hoverCursor = "cell";
        break;
      case "hand":
        canvas.defaultCursor = "grab";
        canvas.hoverCursor = "grab";
        break;
      case "zoom":
        canvas.defaultCursor = "zoom-in";
        canvas.hoverCursor = "zoom-in";
        break;
      case "text":
        canvas.defaultCursor = "text";
        canvas.hoverCursor = "text";
        break;
      default:
        canvas.defaultCursor = "crosshair";
        canvas.hoverCursor = "crosshair";
    }

    canvas.renderAll();
  }, [canvas, activeTool, foregroundColor, brushSettings]);

  // 获取鼠标在画布上的位置
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getPointerPosition = useCallback(
    (opt: any): Point => {
      // Fabric.js v6 使用 scenePoint，v5 使用 absolutePointer
      if (opt.scenePoint) {
        return { x: opt.scenePoint.x, y: opt.scenePoint.y };
      }
      if (opt.absolutePointer) {
        return { x: opt.absolutePointer.x, y: opt.absolutePointer.y };
      }
      if (opt.pointer) {
        return { x: opt.pointer.x, y: opt.pointer.y };
      }
      // 如果都没有，从原始事件计算
      if (opt.e && canvas) {
        const canvasEl = canvas.getElement();
        const rect = canvasEl.getBoundingClientRect();
        const e = opt.e as MouseEvent;
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
      return { x: 0, y: 0 };
    },
    [canvas],
  );

  // 创建多边形
  const createPolygon = useCallback(
    (cx: number, cy: number, radius: number, sides: number): fabric.Polygon => {
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        points.push({
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
        });
      }
      return new fabric.Polygon(points, {
        fill: foregroundColor,
        stroke: foregroundColor,
        strokeWidth: 1,
        left: cx - radius,
        top: cy - radius,
      });
    },
    [foregroundColor],
  );

  // 创建星形
  const createStar = useCallback(
    (
      cx: number,
      cy: number,
      outerRadius: number,
      numPoints: number,
      innerRadiusRatio: number,
    ): fabric.Polygon => {
      const points: { x: number; y: number }[] = [];
      const innerRadius = outerRadius * innerRadiusRatio;

      for (let i = 0; i < numPoints * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / numPoints - Math.PI / 2;
        points.push({
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
        });
      }

      return new fabric.Polygon(points, {
        fill: foregroundColor,
        stroke: foregroundColor,
        strokeWidth: 1,
        left: cx - outerRadius,
        top: cy - outerRadius,
      });
    },
    [foregroundColor],
  );

  // 处理鼠标按下
  const handleMouseDown = useCallback(
    (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
      if (!canvas) return;

      const pointer = getPointerPosition(opt);

      // 跳过绘图模式
      if (activeTool === "pencil" || activeTool === "brush") return;
      if (activeTool === "select" || activeTool === "directSelect") return;

      // 钢笔工具
      if (activeTool === "pen") {
        const newPoint: AnchorPoint = {
          x: pointer.x,
          y: pointer.y,
          type: "corner",
        };
        addPenPoint(newPoint);

        // 绘制预览点
        const circle = new fabric.Circle({
          left: pointer.x - 4,
          top: pointer.y - 4,
          radius: 4,
          fill: "#3B82F6",
          stroke: "#fff",
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (circle as any).isPenPreview = true;
        canvas.add(circle);
        canvas.renderAll();
        return;
      }

      // 抓手工具
      if (activeTool === "hand") {
        canvas.defaultCursor = "grabbing";
        return;
      }

      // 缩放工具
      if (activeTool === "zoom") {
        const newZoom = opt.e.shiftKey ? zoom * 0.8 : zoom * 1.25;
        setZoom(Math.max(0.1, Math.min(10, newZoom)));
        return;
      }

      // 橡皮擦工具 - 点击删除对象
      if (activeTool === "eraser") {
        const target = canvas.findTarget(opt.e as MouseEvent);
        if (target && target instanceof fabric.FabricObject) {
          canvas.remove(target);
          canvas.discardActiveObject();
          canvas.renderAll();
          updateLayers();
          addToHistory(JSON.stringify(canvas.toJSON()));
        }
        return;
      }

      // 吸管工具 - 从对象或画布像素拾取颜色
      if (activeTool === "eyedropper") {
        const target = canvas.findTarget(opt.e as MouseEvent);
        if (target && target instanceof fabric.FabricObject) {
          // 优先从对象获取颜色
          const fill = target.get("fill");
          const stroke = target.get("stroke");
          // 对于线条类型优先取stroke，其他取fill
          const objType = target.type;
          let colorToUse = fill;
          if (
            objType === "line" ||
            objType === "path" ||
            objType === "polyline"
          ) {
            colorToUse = stroke || fill;
          }
          if (typeof colorToUse === "string" && colorToUse !== "transparent") {
            const hexColor = toHexColor(colorToUse);
            useEditorStore.getState().setForegroundColor(hexColor);
          }
        } else {
          // 从画布像素拾取颜色
          const canvasEl = canvas.getElement();
          const ctx = canvasEl.getContext("2d");
          if (ctx) {
            const pixel = ctx.getImageData(pointer.x, pointer.y, 1, 1).data;
            const hexColor = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;
            useEditorStore.getState().setForegroundColor(hexColor);
          }
        }
        return;
      }

      // 油漆桶工具
      if (activeTool === "paintBucket") {
        const target = canvas.findTarget(opt.e as MouseEvent);
        if (target && target instanceof fabric.FabricObject) {
          target.set("fill", foregroundColor);
          canvas.renderAll();
          addToHistory(JSON.stringify(canvas.toJSON()));
        }
        return;
      }

      // 开始绘制形状
      setIsDrawing(true);
      setStartPoint(pointer);

      let obj: fabric.Object | null = null;

      switch (activeTool) {
        case "rectangle":
          obj = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: foregroundColor,
            stroke: foregroundColor,
            strokeWidth: 1,
            rx: cornerRadius,
            ry: cornerRadius,
          });
          break;

        case "roundedRect":
          obj = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: foregroundColor,
            stroke: foregroundColor,
            strokeWidth: 1,
            rx: 10,
            ry: 10,
          });
          break;

        case "ellipse":
          obj = new fabric.Ellipse({
            left: pointer.x,
            top: pointer.y,
            rx: 0,
            ry: 0,
            fill: foregroundColor,
            stroke: foregroundColor,
            strokeWidth: 1,
          });
          break;

        case "circle":
          obj = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 0,
            fill: foregroundColor,
            stroke: foregroundColor,
            strokeWidth: 1,
          });
          break;

        case "line":
          obj = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: foregroundColor,
            strokeWidth: 2,
          });
          break;

        case "arrow":
          obj = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: foregroundColor,
            strokeWidth: 2,
          });
          break;

        case "text":
          obj = new fabric.IText("点击输入文字", {
            left: pointer.x,
            top: pointer.y,
            fontSize: 24,
            fill: foregroundColor,
            fontFamily: "Arial",
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (obj as any).id = uuidv4();
          canvas.add(obj);
          canvas.setActiveObject(obj);
          (obj as fabric.IText).enterEditing();
          setIsDrawing(false);
          updateLayers();
          addToHistory(JSON.stringify(canvas.toJSON()));
          // 添加文字后自动切换回直接选择工具
          useEditorStore.getState().setActiveTool("directSelect");
          return;
      }

      if (obj) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any).id = uuidv4();
        obj.selectable = false;
        canvas.add(obj);
        setTempObject(obj);
      }
    },
    [
      canvas,
      activeTool,
      zoom,
      foregroundColor,
      cornerRadius,
      addPenPoint,
      setZoom,
      getPointerPosition,
      addToHistory,
      updateLayers,
    ],
  );

  // 处理鼠标移动
  const handleMouseMove = useCallback(
    (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
      if (!canvas) return;

      const pointer = getPointerPosition(opt);

      // 钢笔工具预览
      if (activeTool === "pen" && penToolState.isDrawing) {
        updatePenPreview(pointer);

        // 绘制预览线
        const lastPoint =
          penToolState.currentPath[penToolState.currentPath.length - 1];
        if (lastPoint) {
          // 移除旧的预览线
          const objects = canvas.getObjects();
          objects.forEach((obj) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((obj as any).isPenPreviewLine) {
              canvas.remove(obj);
            }
          });

          // 绘制新的预览线
          const line = new fabric.Line(
            [lastPoint.x, lastPoint.y, pointer.x, pointer.y],
            {
              stroke: "#3B82F6",
              strokeWidth: 1,
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
            },
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (line as any).isPenPreviewLine = true;
          canvas.add(line);
          canvas.renderAll();
        }
        return;
      }

      if (!isDrawing || !startPoint || !tempObject) return;

      const width = pointer.x - startPoint.x;
      const height = pointer.y - startPoint.y;

      switch (activeTool) {
        case "rectangle":
        case "roundedRect":
          tempObject.set({
            left: width > 0 ? startPoint.x : pointer.x,
            top: height > 0 ? startPoint.y : pointer.y,
            width: Math.abs(width),
            height: Math.abs(height),
          });
          break;

        case "ellipse":
          (tempObject as fabric.Ellipse).set({
            left: width > 0 ? startPoint.x : pointer.x,
            top: height > 0 ? startPoint.y : pointer.y,
            rx: Math.abs(width) / 2,
            ry: Math.abs(height) / 2,
          });
          break;

        case "circle":
          const radius = Math.sqrt(width * width + height * height) / 2;
          (tempObject as fabric.Circle).set({
            radius,
            left: startPoint.x - radius,
            top: startPoint.y - radius,
          });
          break;

        case "line":
        case "arrow":
          (tempObject as fabric.Line).set({
            x2: pointer.x,
            y2: pointer.y,
          });
          break;
      }

      canvas.renderAll();
    },
    [
      canvas,
      isDrawing,
      startPoint,
      tempObject,
      activeTool,
      penToolState,
      updatePenPreview,
      getPointerPosition,
    ],
  );

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    if (!canvas) return;

    if (activeTool === "pen") {
      return; // 钢笔工具通过双击或按回车结束
    }

    if (!isDrawing || !tempObject) {
      setIsDrawing(false);
      return;
    }

    tempObject.selectable = true;

    // 如果是箭头，添加箭头头部
    if (activeTool === "arrow") {
      const line = tempObject as fabric.Line;
      const x1 = line.x1 || 0;
      const y1 = line.y1 || 0;
      const x2 = line.x2 || 0;
      const y2 = line.y2 || 0;

      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLength = 15;

      const arrowHead = new fabric.Triangle({
        left: x2,
        top: y2,
        width: headLength,
        height: headLength,
        fill: foregroundColor,
        angle: (angle * 180) / Math.PI + 90,
        originX: "center",
        originY: "center",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (arrowHead as any).id = uuidv4();
      canvas.add(arrowHead);
    }

    // 多边形和星形在mouseUp时创建 - 使用默认半径
    if (activeTool === "polygon" && startPoint) {
      const defaultRadius = 50;
      const polygon = createPolygon(
        startPoint.x,
        startPoint.y,
        defaultRadius,
        polygonSides,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (polygon as any).id = uuidv4();
      canvas.add(polygon);
      canvas.setActiveObject(polygon);
      setIsDrawing(false);
      setStartPoint(null);
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
      return;
    }

    if (activeTool === "star" && startPoint) {
      const defaultRadius = 50;
      const star = createStar(
        startPoint.x,
        startPoint.y,
        defaultRadius,
        starPoints,
        starInnerRadius,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (star as any).id = uuidv4();
      canvas.add(star);
      canvas.setActiveObject(star);
      setIsDrawing(false);
      setStartPoint(null);
      updateLayers();
      addToHistory(JSON.stringify(canvas.toJSON()));
      return;
    }

    canvas.setActiveObject(tempObject);
    canvas.renderAll();
    updateLayers();
    addToHistory(JSON.stringify(canvas.toJSON()));

    setIsDrawing(false);
    setStartPoint(null);
    setTempObject(null);
  }, [
    canvas,
    isDrawing,
    tempObject,
    activeTool,
    startPoint,
    foregroundColor,
    polygonSides,
    starPoints,
    starInnerRadius,
    createPolygon,
    createStar,
    updateLayers,
    addToHistory,
  ]);

  // 处理双击（完成钢笔路径）
  const handleDoubleClick = useCallback(() => {
    if (activeTool === "pen" && penToolState.currentPath.length >= 2) {
      // 移除预览元素
      if (canvas) {
        const objects = canvas.getObjects();
        objects.forEach((obj) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((obj as any).isPenPreview || (obj as any).isPenPreviewLine) {
            canvas.remove(obj);
          }
        });
      }
      finishPenPath(false);
    }
  }, [canvas, activeTool, penToolState, finishPenPath]);

  // 绑定事件
  useEffect(() => {
    if (!canvas) return;

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);
    canvas.on("mouse:dblclick", handleDoubleClick);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
      canvas.off("mouse:dblclick", handleDoubleClick);
    };
  }, [
    canvas,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
  ]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvas) return;

      // 删除
      if (e.key === "Delete" || e.key === "Backspace") {
        // 检查是否在输入框中
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return; // 在输入框中不处理删除
        }

        const activeObj = canvas.getActiveObject();
        if (activeObj && !(activeObj as fabric.IText).isEditing) {
          e.preventDefault(); // 阻止默认行为

          // 检查是否是group内的子元素（二级图层）
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parentGroup = (activeObj as any).group;
          if (parentGroup && parentGroup.type === "group") {
            // 从group中移除子元素
            parentGroup.remove(activeObj);
            // 如果group为空，也删除group
            if (parentGroup.getObjects().length === 0) {
              canvas.remove(parentGroup);
            }
          } else {
            canvas.remove(activeObj);
          }

          canvas.discardActiveObject();
          canvas.renderAll();
          updateLayers();
          addToHistory(JSON.stringify(canvas.toJSON()));
        }
      }

      // 回车完成钢笔路径
      if (e.key === "Enter" && activeTool === "pen") {
        if (penToolState.currentPath.length >= 2) {
          if (canvas) {
            const objects = canvas.getObjects();
            objects.forEach((obj) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ((obj as any).isPenPreview || (obj as any).isPenPreviewLine) {
                canvas.remove(obj);
              }
            });
          }
          finishPenPath(e.shiftKey); // Shift+Enter 闭合路径
        }
      }

      // Ctrl+C 复制
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        // 检查是否在文字编辑模式
        const activeObj = canvas.getActiveObject();
        if (activeObj && (activeObj as fabric.IText).isEditing) {
          return; // 文字编辑中，使用默认复制
        }

        if (activeObj) {
          e.preventDefault();
          activeObj.clone().then((cloned: fabric.Object) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).__clipboard = cloned;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).__clipboardCenter = {
              x: canvas.width ? canvas.width / 2 : 400,
              y: canvas.height ? canvas.height / 2 : 300,
            };
            console.log("[复制] 对象已复制到剪贴板");
          });
        }
      }

      // Ctrl+V 粘贴
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        // 检查是否在文字编辑模式
        const activeObj = canvas.getActiveObject();
        if (activeObj && (activeObj as fabric.IText).isEditing) {
          return; // 文字编辑中，使用默认粘贴
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const clipboard = (window as any).__clipboard;
        if (clipboard) {
          e.preventDefault();
          clipboard.clone().then((cloned: fabric.Object) => {
            // 计算画布中心位置
            const canvasCenterX = canvas.width ? canvas.width / 2 : 400;
            const canvasCenterY = canvas.height ? canvas.height / 2 : 300;

            // 获取对象尺寸
            const objWidth = (cloned.width || 0) * (cloned.scaleX || 1);
            const objHeight = (cloned.height || 0) * (cloned.scaleY || 1);

            // 将对象放置在画布中心，并稍微偏移避免重叠
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pasteCount = ((window as any).__pasteCount || 0) + 1;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).__pasteCount = pasteCount;

            const offset = (pasteCount % 10) * 20; // 每次粘贴偏移20px，最多偏移10次后重置

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
            console.log("[粘贴] 对象已粘贴到画布中心");
          });
        }
      }

      // Ctrl+Z 撤回
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.getState().undo();
      }

      // Ctrl+Shift+Z 或 Ctrl+Y 重做
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        useEditorStore.getState().redo();
      }

      // Escape 取消当前操作
      if (e.key === "Escape") {
        if (activeTool === "pen") {
          setPenToolState({ isDrawing: false, currentPath: [] });
          if (canvas) {
            const objects = canvas.getObjects();
            objects.forEach((obj) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ((obj as any).isPenPreview || (obj as any).isPenPreviewLine) {
                canvas.remove(obj);
              }
            });
            canvas.renderAll();
          }
        }
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canvas,
    activeTool,
    penToolState,
    finishPenPath,
    setPenToolState,
    updateLayers,
    addToHistory,
  ]);

  // 绘制网格
  useEffect(() => {
    if (!canvas) return;

    // 移除旧网格
    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((obj as any).isGrid) {
        canvas.remove(obj);
      }
    });

    if (grid.showGrid) {
      const gridSize = grid.size;
      const canvasWidth = canvas.width || 0;
      const canvasHeight = canvas.height || 0;

      // 绘制网格线
      for (let i = 0; i <= canvasWidth / gridSize; i++) {
        const line = new fabric.Line(
          [i * gridSize, 0, i * gridSize, canvasHeight],
          {
            stroke: grid.color,
            strokeWidth: 0.5,
            opacity: grid.opacity,
            selectable: false,
            evented: false,
          },
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (line as any).isGrid = true;
        canvas.add(line);
        canvas.sendObjectToBack(line);
      }

      for (let i = 0; i <= canvasHeight / gridSize; i++) {
        const line = new fabric.Line(
          [0, i * gridSize, canvasWidth, i * gridSize],
          {
            stroke: grid.color,
            strokeWidth: 0.5,
            opacity: grid.opacity,
            selectable: false,
            evented: false,
          },
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (line as any).isGrid = true;
        canvas.add(line);
        canvas.sendObjectToBack(line);
      }
    }

    canvas.renderAll();
  }, [canvas, grid]);

  // 绘制参考线
  useEffect(() => {
    if (!canvas) return;

    // 移除旧参考线
    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((obj as any).isGuide) {
        canvas.remove(obj);
      }
    });

    // 绘制新参考线
    guides.forEach((guide) => {
      const canvasWidth = canvas.width || 0;
      const canvasHeight = canvas.height || 0;

      const line =
        guide.orientation === "horizontal"
          ? new fabric.Line([0, guide.position, canvasWidth, guide.position], {
              stroke: guide.color || "#00AAFF",
              strokeWidth: 1,
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
            })
          : new fabric.Line([guide.position, 0, guide.position, canvasHeight], {
              stroke: guide.color || "#00AAFF",
              strokeWidth: 1,
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
            });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (line as any).isGuide = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (line as any).guideId = guide.id;
      canvas.add(line);
    });

    canvas.renderAll();
  }, [canvas, guides]);

  // 标尺尺寸
  const rulerWidth = canvasDimensions.width + 100;
  const rulerHeight = canvasDimensions.height + 100;

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden flex flex-col">
      {/* 顶部标尺行 */}
      {showRulers && (
        <div className="flex flex-shrink-0">
          {/* 标尺角落 */}
          <div className="w-6 h-6 bg-gray-300 border-r border-b border-gray-400 flex-shrink-0" />
          {/* 顶部标尺 */}
          <div className="h-6 bg-gray-200 border-b border-gray-300 flex-1 overflow-hidden">
            <svg width="100%" height="100%" className="text-gray-500">
              {Array.from({ length: Math.ceil(rulerWidth / 100) }).map(
                (_, i) => (
                  <g key={i}>
                    <line
                      x1={i * 100}
                      y1="16"
                      x2={i * 100}
                      y2="24"
                      stroke="currentColor"
                    />
                    <text
                      x={i * 100 + 2}
                      y="12"
                      fontSize="10"
                      fill="currentColor"
                    >
                      {i * 100}
                    </text>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <line
                        key={j}
                        x1={i * 100 + j * 10}
                        y1="20"
                        x2={i * 100 + j * 10}
                        y2="24"
                        stroke="currentColor"
                        strokeWidth="0.5"
                      />
                    ))}
                  </g>
                ),
              )}
            </svg>
          </div>
        </div>
      )}

      {/* 主内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧标尺 */}
        {showRulers && (
          <div className="w-6 bg-gray-200 border-r border-gray-300 flex-shrink-0 overflow-hidden">
            <svg width="100%" height="100%" className="text-gray-500">
              {Array.from({ length: Math.ceil(rulerHeight / 100) }).map(
                (_, i) => (
                  <g key={i}>
                    <line
                      x1="16"
                      y1={i * 100}
                      x2="24"
                      y2={i * 100}
                      stroke="currentColor"
                    />
                    <text
                      x="2"
                      y={i * 100 + 12}
                      fontSize="10"
                      fill="currentColor"
                      style={{ writingMode: "vertical-lr" }}
                    >
                      {i * 100}
                    </text>
                  </g>
                ),
              )}
            </svg>
          </div>
        )}

        {/* 画布区域 - 完全填充可用空间 */}
        <div ref={canvasContainerRef} className="flex-1 overflow-hidden">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};

export default CanvasEditorPro;
