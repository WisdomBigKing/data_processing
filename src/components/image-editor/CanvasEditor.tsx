"use client";

import React, { useEffect, useRef, useCallback } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/store/editor-store";
import { v4 as uuidv4 } from "uuid";

export const CanvasEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const tempShapeRef = useRef<fabric.Object | null>(null);

  const {
    canvas,
    setCanvas,
    activeTool,
    setActiveObject,
    updateLayers,
    addToHistory,
    canvasWidth,
    canvasHeight,
    zoom,
  } = useEditorStore();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true,
    });

    fabricCanvas.on("selection:created", (e) => {
      setActiveObject(e.selected?.[0] || null);
    });

    fabricCanvas.on("selection:updated", (e) => {
      setActiveObject(e.selected?.[0] || null);
    });

    fabricCanvas.on("selection:cleared", () => {
      setActiveObject(null);
    });

    fabricCanvas.on("object:modified", () => {
      updateLayers();
      addToHistory(JSON.stringify(fabricCanvas.toJSON()));
    });

    fabricCanvas.on("object:added", () => {
      updateLayers();
    });

    fabricCanvas.on("object:removed", () => {
      updateLayers();
    });

    setCanvas(fabricCanvas);
    addToHistory(JSON.stringify(fabricCanvas.toJSON()));

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Handle drawing tools
  useEffect(() => {
    if (!canvas) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseDown = (opt: any) => {
      if (activeTool === "select") return;

      const pointer = opt.absolutePointer || opt.pointer || { x: 0, y: 0 };
      isDrawingRef.current = true;
      startPointRef.current = { x: pointer.x, y: pointer.y };

      if (activeTool === "text") {
        const text = new fabric.IText("双击编辑文字", {
          left: pointer.x,
          top: pointer.y,
          fontFamily: "Arial",
          fontSize: 24,
          fill: "#000000",
        });
        (text as fabric.IText & { id: string }).id = uuidv4();
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        canvas.renderAll();
        addToHistory(JSON.stringify(canvas.toJSON()));
        isDrawingRef.current = false;
        return;
      }

      let shape: fabric.Object | null = null;

      switch (activeTool) {
        case "rectangle":
          shape = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: "transparent",
            stroke: "#000000",
            strokeWidth: 2,
          });
          break;
        case "circle":
          shape = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 0,
            fill: "transparent",
            stroke: "#000000",
            strokeWidth: 2,
          });
          break;
        case "line":
          shape = new fabric.Line(
            [pointer.x, pointer.y, pointer.x, pointer.y],
            {
              stroke: "#000000",
              strokeWidth: 2,
            },
          );
          break;
        case "arrow":
          shape = new fabric.Line(
            [pointer.x, pointer.y, pointer.x, pointer.y],
            {
              stroke: "#000000",
              strokeWidth: 2,
            },
          );
          break;
      }

      if (shape) {
        (shape as fabric.Object & { id: string }).id = uuidv4();
        tempShapeRef.current = shape;
        canvas.add(shape);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseMove = (opt: any) => {
      if (
        !isDrawingRef.current ||
        !startPointRef.current ||
        !tempShapeRef.current
      )
        return;

      const pointer = opt.absolutePointer || opt.pointer || { x: 0, y: 0 };
      const startX = startPointRef.current.x;
      const startY = startPointRef.current.y;

      switch (activeTool) {
        case "rectangle":
          const rect = tempShapeRef.current as fabric.Rect;
          const width = pointer.x - startX;
          const height = pointer.y - startY;

          if (width > 0) {
            rect.set({ width });
          } else {
            rect.set({ left: pointer.x, width: Math.abs(width) });
          }

          if (height > 0) {
            rect.set({ height });
          } else {
            rect.set({ top: pointer.y, height: Math.abs(height) });
          }
          break;

        case "circle":
          const circle = tempShapeRef.current as fabric.Circle;
          const radius =
            Math.sqrt(
              Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2),
            ) / 2;
          circle.set({ radius });
          break;

        case "line":
        case "arrow":
          const line = tempShapeRef.current as fabric.Line;
          line.set({ x2: pointer.x, y2: pointer.y });
          break;
      }

      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (!isDrawingRef.current) return;

      isDrawingRef.current = false;
      startPointRef.current = null;

      if (tempShapeRef.current) {
        if (activeTool === "arrow") {
          // Add arrowhead to line
          const line = tempShapeRef.current as fabric.Line;
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
            fill: "#000000",
            angle: (angle * 180) / Math.PI + 90,
            originX: "center",
            originY: "center",
          });

          const group = new fabric.Group([line, arrowHead], {
            selectable: true,
          });
          (group as fabric.Group & { id: string }).id = uuidv4();

          canvas.remove(line);
          canvas.add(group);
        }

        canvas.setActiveObject(tempShapeRef.current);
        tempShapeRef.current = null;
        addToHistory(JSON.stringify(canvas.toJSON()));
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    // Freehand drawing setup
    if (activeTool === "pencil" || activeTool === "brush") {
      canvas.isDrawingMode = true;
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = "#000000";
        canvas.freeDrawingBrush.width = 3;
      }
    } else {
      canvas.isDrawingMode = false;
    }

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
    };
  }, [canvas, activeTool, addToHistory, updateLayers]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvas) return;

      // Delete key
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObj = canvas.getActiveObject();
        if (activeObj && !(activeObj as fabric.IText).isEditing) {
          if (activeObj.type === "activeSelection") {
            (activeObj as fabric.ActiveSelection).forEachObject((obj) => {
              canvas.remove(obj);
            });
          } else {
            canvas.remove(activeObj);
          }
          canvas.discardActiveObject();
          canvas.renderAll();
          updateLayers();
          addToHistory(JSON.stringify(canvas.toJSON()));
        }
      }

      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        useEditorStore.getState().undo();
      }

      // Ctrl+Y - Redo
      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        useEditorStore.getState().redo();
      }

      // Ctrl+C - Copy
      if (e.ctrlKey && e.key === "c") {
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
          // fabric.js v6 uses async clone
          activeObj.clone().then((cloned: fabric.FabricObject) => {
            (
              window as Window & { _clipboard?: fabric.FabricObject }
            )._clipboard = cloned;
          });
        }
      }

      // Ctrl+V - Paste
      if (e.ctrlKey && e.key === "v") {
        const clipboard = (
          window as Window & { _clipboard?: fabric.FabricObject }
        )._clipboard;
        if (clipboard) {
          clipboard.clone().then((cloned: fabric.FabricObject) => {
            canvas.discardActiveObject();
            cloned.set({
              left: (cloned.left || 0) + 20,
              top: (cloned.top || 0) + 20,
              evented: true,
            });
            canvas.add(cloned);
            (
              window as Window & { _clipboard?: fabric.FabricObject }
            )._clipboard = cloned;
            canvas.setActiveObject(cloned);
            canvas.requestRenderAll();
            updateLayers();
            addToHistory(JSON.stringify(canvas.toJSON()));
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canvas, addToHistory, updateLayers]);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center p-8"
    >
      <div
        className="shadow-2xl"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
