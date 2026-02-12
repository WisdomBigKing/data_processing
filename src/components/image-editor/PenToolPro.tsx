'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useEditorStore } from '@/store/editor-store';
import * as fabric from 'fabric';
import type { AnchorPoint, Point } from './types';

interface PenToolProProps {
  enabled: boolean;
}

// 锚点类型图标
const AnchorIcon: React.FC<{ type: 'corner' | 'smooth' | 'symmetric'; selected?: boolean }> = ({ type, selected }) => {
  const color = selected ? '#3B82F6' : '#9CA3AF';
  const size = selected ? 8 : 6;
  
  if (type === 'corner') {
    return <rect x={-size/2} y={-size/2} width={size} height={size} fill="white" stroke={color} strokeWidth={1.5} />;
  } else if (type === 'smooth') {
    return <circle cx={0} cy={0} r={size/2} fill="white" stroke={color} strokeWidth={1.5} />;
  } else {
    return <circle cx={0} cy={0} r={size/2} fill={color} stroke={color} strokeWidth={1.5} />;
  }
};

export const PenToolPro: React.FC<PenToolProProps> = ({ enabled }) => {
  const { 
    canvas, 
    penToolState, 
    setPenToolState,
    foregroundColor,
    addToHistory,
    updateLayers,
    setActiveTool
  } = useEditorStore();

  const [previewPath, setPreviewPath] = useState<fabric.Path | null>(null);
  const [anchorPoints, setAnchorPoints] = useState<AnchorPoint[]>([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'point' | 'handleIn' | 'handleOut' | null>(null);
  const lastMousePos = useRef<Point>({ x: 0, y: 0 });

  // 将锚点转换为SVG路径数据
  const pointsToPathData = useCallback((points: AnchorPoint[], closed: boolean = false): string => {
    if (points.length === 0) return '';
    
    let d = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      const cp1x = prev.handleOut ? prev.x + prev.handleOut.x : prev.x;
      const cp1y = prev.handleOut ? prev.y + prev.handleOut.y : prev.y;
      const cp2x = curr.handleIn ? curr.x + curr.handleIn.x : curr.x;
      const cp2y = curr.handleIn ? curr.y + curr.handleIn.y : curr.y;
      
      if (prev.handleOut || curr.handleIn) {
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      } else {
        d += ` L ${curr.x} ${curr.y}`;
      }
    }
    
    if (closed && points.length > 2) {
      const last = points[points.length - 1];
      const first = points[0];
      
      const cp1x = last.handleOut ? last.x + last.handleOut.x : last.x;
      const cp1y = last.handleOut ? last.y + last.handleOut.y : last.y;
      const cp2x = first.handleIn ? first.x + first.handleIn.x : first.x;
      const cp2y = first.handleIn ? first.y + first.handleIn.y : first.y;
      
      if (last.handleOut || first.handleIn) {
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${first.x} ${first.y}`;
      }
      d += ' Z';
    }
    
    return d;
  }, []);

  // 更新预览路径
  const updatePreview = useCallback((points: AnchorPoint[], mousePos?: Point) => {
    if (!canvas) return;
    
    // 移除旧预览
    if (previewPath) {
      canvas.remove(previewPath);
    }
    
    if (points.length === 0) {
      setPreviewPath(null);
      return;
    }

    let pathData = pointsToPathData(points, false);
    
    // 添加到鼠标位置的预览线
    if (mousePos && points.length > 0) {
      const lastPoint = points[points.length - 1];
      const cp1x = lastPoint.handleOut ? lastPoint.x + lastPoint.handleOut.x : lastPoint.x;
      const cp1y = lastPoint.handleOut ? lastPoint.y + lastPoint.handleOut.y : lastPoint.y;
      pathData += ` C ${cp1x} ${cp1y}, ${mousePos.x} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`;
    }

    const newPath = new fabric.Path(pathData, {
      fill: 'transparent',
      stroke: foregroundColor,
      strokeWidth: 2,
      selectable: false,
      evented: false,
      objectCaching: false,
    });

    canvas.add(newPath);
    setPreviewPath(newPath);
    canvas.renderAll();
  }, [canvas, previewPath, pointsToPathData, foregroundColor]);

  // 完成路径绘制
  const finishPath = useCallback((closed: boolean = false) => {
    if (!canvas || anchorPoints.length < 2) {
      setAnchorPoints([]);
      if (previewPath) {
        canvas?.remove(previewPath);
        setPreviewPath(null);
      }
      return;
    }

    // 移除预览
    if (previewPath) {
      canvas.remove(previewPath);
      setPreviewPath(null);
    }

    // 创建最终路径
    const pathData = pointsToPathData(anchorPoints, closed);
    const finalPath = new fabric.Path(pathData, {
      fill: closed ? foregroundColor : 'transparent',
      stroke: foregroundColor,
      strokeWidth: 2,
      selectable: true,
      // 保存锚点数据用于后续编辑
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // 存储锚点数据
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (finalPath as any).anchorPoints = JSON.parse(JSON.stringify(anchorPoints));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (finalPath as any).id = `path-${Date.now()}`;

    canvas.add(finalPath);
    canvas.setActiveObject(finalPath);
    canvas.renderAll();
    
    updateLayers();
    addToHistory(JSON.stringify(canvas.toJSON()));
    
    // 重置状态
    setAnchorPoints([]);
    setPenToolState({ isDrawing: false, currentPath: [], mode: 'draw' });
  }, [canvas, anchorPoints, previewPath, pointsToPathData, foregroundColor, updateLayers, addToHistory, setPenToolState]);

  // 处理画布点击
  const handleCanvasClick = useCallback((e: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
    if (!enabled || !canvas) return;
    
    const pointer = canvas.getViewportPoint(e.e);
    const x = pointer.x;
    const y = pointer.y;

    // 检查是否点击了第一个锚点（闭合路径）
    if (anchorPoints.length > 2) {
      const firstPoint = anchorPoints[0];
      const dist = Math.sqrt(Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2));
      if (dist < 10) {
        finishPath(true);
        return;
      }
    }

    // 添加新锚点
    const newPoint: AnchorPoint = {
      x,
      y,
      type: 'corner',
      handleIn: undefined,
      handleOut: undefined,
    };

    const newPoints = [...anchorPoints, newPoint];
    setAnchorPoints(newPoints);
    setSelectedPointIndex(newPoints.length - 1);
    setPenToolState({ isDrawing: true, currentPath: newPoints, mode: 'draw' });
    
    updatePreview(newPoints);
  }, [enabled, canvas, anchorPoints, finishPath, updatePreview, setPenToolState]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((e: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
    if (!enabled || !canvas) return;
    
    const pointer = canvas.getViewportPoint(e.e);
    const x = pointer.x;
    const y = pointer.y;
    
    lastMousePos.current = { x, y };

    if (isDragging && selectedPointIndex !== null && dragType) {
      // 拖拽控制柄
      const points = [...anchorPoints];
      const point = points[selectedPointIndex];
      
      if (dragType === 'handleOut') {
        const dx = x - point.x;
        const dy = y - point.y;
        point.handleOut = { x: dx, y: dy };
        
        // 对称模式下同步入控制柄
        if (point.type === 'symmetric') {
          point.handleIn = { x: -dx, y: -dy };
        } else if (point.type === 'smooth' && point.handleIn) {
          const len = Math.sqrt(point.handleIn.x ** 2 + point.handleIn.y ** 2);
          const newLen = Math.sqrt(dx ** 2 + dy ** 2);
          if (newLen > 0) {
            point.handleIn = { 
              x: -dx * len / newLen, 
              y: -dy * len / newLen 
            };
          }
        }
      } else if (dragType === 'handleIn') {
        const dx = x - point.x;
        const dy = y - point.y;
        point.handleIn = { x: dx, y: dy };
        
        if (point.type === 'symmetric') {
          point.handleOut = { x: -dx, y: -dy };
        } else if (point.type === 'smooth' && point.handleOut) {
          const len = Math.sqrt(point.handleOut.x ** 2 + point.handleOut.y ** 2);
          const newLen = Math.sqrt(dx ** 2 + dy ** 2);
          if (newLen > 0) {
            point.handleOut = { 
              x: -dx * len / newLen, 
              y: -dy * len / newLen 
            };
          }
        }
      } else if (dragType === 'point') {
        point.x = x;
        point.y = y;
      }
      
      setAnchorPoints(points);
      updatePreview(points);
    } else if (anchorPoints.length > 0 && penToolState.isDrawing) {
      // 绘制预览线
      updatePreview(anchorPoints, { x, y });
    }
  }, [enabled, canvas, isDragging, selectedPointIndex, dragType, anchorPoints, penToolState.isDrawing, updatePreview]);

  // 处理鼠标按下（开始拖拽控制柄）
  const handleMouseDown = useCallback((e: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
    if (!enabled || !canvas || anchorPoints.length === 0) return;
    
    const pointer = canvas.getViewportPoint(e.e);
    const x = pointer.x;
    const y = pointer.y;

    // 检查是否点击了锚点或控制柄
    for (let i = 0; i < anchorPoints.length; i++) {
      const point = anchorPoints[i];
      
      // 检查控制柄
      if (point.handleOut) {
        const hx = point.x + point.handleOut.x;
        const hy = point.y + point.handleOut.y;
        if (Math.sqrt((x - hx) ** 2 + (y - hy) ** 2) < 8) {
          setSelectedPointIndex(i);
          setDragType('handleOut');
          setIsDragging(true);
          return;
        }
      }
      
      if (point.handleIn) {
        const hx = point.x + point.handleIn.x;
        const hy = point.y + point.handleIn.y;
        if (Math.sqrt((x - hx) ** 2 + (y - hy) ** 2) < 8) {
          setSelectedPointIndex(i);
          setDragType('handleIn');
          setIsDragging(true);
          return;
        }
      }
      
      // 检查锚点
      if (Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2) < 8) {
        setSelectedPointIndex(i);
        setDragType('point');
        setIsDragging(true);
        return;
      }
    }
  }, [enabled, canvas, anchorPoints]);

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      // 如果拖拽了控制柄，将锚点类型改为smooth
      if (dragType === 'handleOut' || dragType === 'handleIn') {
        const points = [...anchorPoints];
        if (selectedPointIndex !== null && points[selectedPointIndex]) {
          const point = points[selectedPointIndex];
          if (point.type === 'corner') {
            point.type = 'smooth';
          }
          setAnchorPoints(points);
        }
      }
    }
    setIsDragging(false);
    setDragType(null);
  }, [isDragging, dragType, anchorPoints, selectedPointIndex]);

  // 键盘事件处理
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // 取消当前路径
        setAnchorPoints([]);
        if (previewPath && canvas) {
          canvas.remove(previewPath);
          setPreviewPath(null);
        }
        setPenToolState({ isDrawing: false, currentPath: [], mode: 'draw' });
      } else if (e.key === 'Enter') {
        // 完成路径（不闭合）
        finishPath(false);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // 删除选中的锚点
        if (selectedPointIndex !== null && anchorPoints.length > 0) {
          const newPoints = anchorPoints.filter((_, i) => i !== selectedPointIndex);
          setAnchorPoints(newPoints);
          setSelectedPointIndex(null);
          updatePreview(newPoints);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, anchorPoints, selectedPointIndex, previewPath, canvas, finishPath, updatePreview, setPenToolState]);

  // 绑定画布事件
  useEffect(() => {
    if (!canvas || !enabled) return;

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('mouse:dblclick', handleCanvasClick);

    // 单击添加点
    const clickHandler = (e: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
      if (!isDragging) {
        handleCanvasClick(e);
      }
    };
    canvas.on('mouse:down', clickHandler);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('mouse:dblclick', handleCanvasClick);
      canvas.off('mouse:down', clickHandler);
    };
  }, [canvas, enabled, handleMouseDown, handleMouseMove, handleMouseUp, handleCanvasClick, isDragging]);

  // 渲染锚点和控制柄的覆盖层
  if (!enabled || anchorPoints.length === 0) return null;

  return (
    <svg 
      className="absolute inset-0 pointer-events-none z-50"
      style={{ width: '100%', height: '100%' }}
    >
      {anchorPoints.map((point, index) => (
        <g key={index}>
          {/* 控制柄线 */}
          {point.handleIn && (
            <>
              <line
                x1={point.x}
                y1={point.y}
                x2={point.x + point.handleIn.x}
                y2={point.y + point.handleIn.y}
                stroke="#3B82F6"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
              <circle
                cx={point.x + point.handleIn.x}
                cy={point.y + point.handleIn.y}
                r={4}
                fill="#3B82F6"
                className="pointer-events-auto cursor-move"
              />
            </>
          )}
          {point.handleOut && (
            <>
              <line
                x1={point.x}
                y1={point.y}
                x2={point.x + point.handleOut.x}
                y2={point.y + point.handleOut.y}
                stroke="#3B82F6"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
              <circle
                cx={point.x + point.handleOut.x}
                cy={point.y + point.handleOut.y}
                r={4}
                fill="#3B82F6"
                className="pointer-events-auto cursor-move"
              />
            </>
          )}
          {/* 锚点 */}
          <g transform={`translate(${point.x}, ${point.y})`}>
            <AnchorIcon 
              type={point.type} 
              selected={selectedPointIndex === index} 
            />
          </g>
        </g>
      ))}
      {/* 闭合提示 */}
      {anchorPoints.length > 2 && (
        <circle
          cx={anchorPoints[0].x}
          cy={anchorPoints[0].y}
          r={10}
          fill="transparent"
          stroke="#10B981"
          strokeWidth={2}
          strokeDasharray="4,4"
          opacity={0.5}
        />
      )}
    </svg>
  );
};

export default PenToolPro;
