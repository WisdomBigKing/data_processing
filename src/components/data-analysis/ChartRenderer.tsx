'use client';

import React, { useRef, useEffect } from 'react';
import type { ChartConfig } from './types';
import { CHART_COLORS } from './types';
import { Download, Maximize2 } from 'lucide-react';

interface ChartRendererProps {
  config: ChartConfig;
  data: Record<string, unknown>[];
  width?: number;
  height?: number;
  onExport?: () => void;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  config,
  data,
  width = 600,
  height = 400,
  onExport,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Chart margins
    const margin = { top: 60, right: 30, bottom: 60, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Draw title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(config.title || '数据分析图表', width / 2, 30);

    // Get data for plotting
    const xKey = config.xAxis || Object.keys(data[0])[0];
    const yKeys = config.yAxis || [Object.keys(data[0])[1]];
    const labels = data.map((d) => String(d[xKey]));

    // Calculate max value for Y axis
    let maxValue = 0;
    yKeys.forEach((yKey) => {
      data.forEach((d) => {
        const val = Number(d[yKey]) || 0;
        if (val > maxValue) maxValue = val;
      });
    });
    maxValue = Math.ceil(maxValue * 1.1); // Add 10% padding

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Y axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.stroke();

    // X axis
    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Draw Y axis labels and grid lines
    const yTickCount = 5;
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';

    for (let i = 0; i <= yTickCount; i++) {
      const y = margin.top + (chartHeight / yTickCount) * i;
      const value = Math.round(maxValue - (maxValue / yTickCount) * i);

      // Grid line
      ctx.strokeStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#6b7280';
      ctx.fillText(String(value), margin.left - 10, y + 4);
    }

    // Draw chart based on type
    const barWidth = chartWidth / labels.length;
    const groupWidth = barWidth * 0.8;

    if (config.type === 'bar' || config.type === 'grouped-bar' || config.type === 'stacked-bar') {
      const barPadding = barWidth * 0.1;
      const singleBarWidth = config.type === 'grouped-bar' 
        ? groupWidth / yKeys.length 
        : groupWidth;

      labels.forEach((label, i) => {
        const x = margin.left + barWidth * i + barPadding;
        let stackedY = 0;

        yKeys.forEach((yKey, keyIndex) => {
          const value = Number(data[i][yKey]) || 0;
          const barHeight = (value / maxValue) * chartHeight;
          
          ctx.fillStyle = CHART_COLORS[keyIndex % CHART_COLORS.length];

          if (config.type === 'stacked-bar') {
            const y = height - margin.bottom - barHeight - stackedY;
            ctx.fillRect(x, y, groupWidth, barHeight);
            stackedY += barHeight;
          } else if (config.type === 'grouped-bar') {
            const barX = x + singleBarWidth * keyIndex;
            const y = height - margin.bottom - barHeight;
            ctx.fillRect(barX, y, singleBarWidth * 0.9, barHeight);
          } else {
            const y = height - margin.bottom - barHeight;
            ctx.fillRect(x, y, groupWidth, barHeight);
          }
        });

        // X axis label
        ctx.fillStyle = '#6b7280';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x + groupWidth / 2, height - margin.bottom + 15);
        if (labels.length > 10) {
          ctx.rotate(-Math.PI / 4);
          ctx.textAlign = 'right';
        }
        ctx.fillText(label.substring(0, 10), 0, 0);
        ctx.restore();
      });
    } else if (config.type === 'line' || config.type === 'area') {
      yKeys.forEach((yKey, keyIndex) => {
        const color = CHART_COLORS[keyIndex % CHART_COLORS.length];
        const points: { x: number; y: number }[] = [];

        labels.forEach((_, i) => {
          const value = Number(data[i][yKey]) || 0;
          const x = margin.left + barWidth * i + barWidth / 2;
          const y = height - margin.bottom - (value / maxValue) * chartHeight;
          points.push({ x, y });
        });

        // Draw area if needed
        if (config.type === 'area') {
          ctx.beginPath();
          ctx.moveTo(points[0].x, height - margin.bottom);
          points.forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.lineTo(points[points.length - 1].x, height - margin.bottom);
          ctx.closePath();
          ctx.fillStyle = color + '40';
          ctx.fill();
        }

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Draw points
        points.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      });

      // X axis labels
      labels.forEach((label, i) => {
        const x = margin.left + barWidth * i + barWidth / 2;
        ctx.fillStyle = '#6b7280';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x, height - margin.bottom + 15);
        if (labels.length > 10) {
          ctx.rotate(-Math.PI / 4);
          ctx.textAlign = 'right';
        }
        ctx.fillText(label.substring(0, 10), 0, 0);
        ctx.restore();
      });
    } else if (config.type === 'pie') {
      const centerX = width / 2;
      const centerY = margin.top + chartHeight / 2;
      const radius = Math.min(chartWidth, chartHeight) / 2 - 20;
      
      const yKey = yKeys[0];
      const total = data.reduce((sum, d) => sum + (Number(d[yKey]) || 0), 0);
      
      let currentAngle = -Math.PI / 2;
      
      data.forEach((d, i) => {
        const value = Number(d[yKey]) || 0;
        const sliceAngle = (value / total) * Math.PI * 2;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Label
        const midAngle = currentAngle + sliceAngle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${((value / total) * 100).toFixed(1)}%`, labelX, labelY);
        
        currentAngle += sliceAngle;
      });
    }

    // Draw legend
    if (config.showLegend !== false && yKeys.length > 0) {
      const legendX = width - margin.right - 120;
      const legendY = margin.top;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(legendX - 10, legendY - 10, 130, yKeys.length * 25 + 10);
      ctx.strokeStyle = '#e5e7eb';
      ctx.strokeRect(legendX - 10, legendY - 10, 130, yKeys.length * 25 + 10);
      
      yKeys.forEach((key, i) => {
        const y = legendY + i * 25;
        ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
        ctx.fillRect(legendX, y, 16, 16);
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(key.substring(0, 12), legendX + 24, y + 12);
      });
    }
  }, [config, data, width, height]);

  const handleExport = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${config.title || 'chart'}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div ref={containerRef} className="relative bg-white rounded-xl border border-gray-200 p-4">
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          onClick={handleExport}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          title="导出图表"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
      <canvas ref={canvasRef} className="mx-auto" />
    </div>
  );
};
