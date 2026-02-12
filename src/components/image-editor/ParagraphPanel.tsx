'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '@/store/editor-store';
import * as fabric from 'fabric';
import { 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  IndentIncrease, IndentDecrease, List, ListOrdered,
  RotateCcw
} from 'lucide-react';

interface ParagraphSettings {
  textAlign: 'left' | 'center' | 'right' | 'justify';
  direction: 'ltr' | 'rtl';
  indent: number;
  firstLineIndent: number;
  spaceBefore: number;
  spaceAfter: number;
  lineHeight: number;
  hyphenation: boolean;
  // 列表
  listType: 'none' | 'bullet' | 'numbered';
  listIndent: number;
}

const defaultSettings: ParagraphSettings = {
  textAlign: 'left',
  direction: 'ltr',
  indent: 0,
  firstLineIndent: 0,
  spaceBefore: 0,
  spaceAfter: 0,
  lineHeight: 1.2,
  hyphenation: false,
  listType: 'none',
  listIndent: 20,
};

export const ParagraphPanel: React.FC = () => {
  const { canvas, activeObject, addToHistory } = useEditorStore();
  const [settings, setSettings] = useState<ParagraphSettings>(defaultSettings);
  const [isTextObject, setIsTextObject] = useState(false);

  // 从活动对象读取段落设置
  useEffect(() => {
    if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
      const textObj = activeObject as fabric.IText;
      setIsTextObject(true);
      setSettings({
        textAlign: (textObj.textAlign as ParagraphSettings['textAlign']) || 'left',
        direction: 'ltr',
        indent: 0,
        firstLineIndent: 0,
        spaceBefore: 0,
        spaceAfter: 0,
        lineHeight: textObj.lineHeight || 1.2,
        hyphenation: false,
        listType: 'none',
        listIndent: 20,
      });
    } else {
      setIsTextObject(false);
    }
  }, [activeObject]);

  // 应用段落设置
  const applySettings = useCallback((newSettings: Partial<ParagraphSettings>) => {
    if (!canvas || !activeObject || !isTextObject) return;
    
    const textObj = activeObject as fabric.IText;
    const merged = { ...settings, ...newSettings };
    setSettings(merged);

    // 应用到对象
    if (newSettings.textAlign !== undefined) {
      textObj.set('textAlign', newSettings.textAlign);
    }
    if (newSettings.lineHeight !== undefined) {
      textObj.set('lineHeight', newSettings.lineHeight);
    }

    canvas.renderAll();
    addToHistory(JSON.stringify(canvas.toJSON()));
  }, [canvas, activeObject, isTextObject, settings, addToHistory]);

  // 增加缩进
  const increaseIndent = () => {
    applySettings({ indent: settings.indent + 20 });
  };

  // 减少缩进
  const decreaseIndent = () => {
    applySettings({ indent: Math.max(0, settings.indent - 20) });
  };

  if (!isTextObject) {
    return (
      <div className="p-3 text-xs text-gray-500 text-center">
        选择文字对象以编辑段落属性
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {/* 对齐方式 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">对齐</span>
        <div className="flex gap-1">
          <button
            onClick={() => applySettings({ textAlign: 'left' })}
            className={`flex-1 p-2 rounded ${settings.textAlign === 'left' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            title="左对齐"
          >
            <AlignLeft className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => applySettings({ textAlign: 'center' })}
            className={`flex-1 p-2 rounded ${settings.textAlign === 'center' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            title="居中对齐"
          >
            <AlignCenter className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => applySettings({ textAlign: 'right' })}
            className={`flex-1 p-2 rounded ${settings.textAlign === 'right' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            title="右对齐"
          >
            <AlignRight className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => applySettings({ textAlign: 'justify' })}
            className={`flex-1 p-2 rounded ${settings.textAlign === 'justify' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            title="两端对齐"
          >
            <AlignJustify className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>

      {/* 缩进控制 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">缩进</span>
        <div className="flex gap-2">
          <button
            onClick={decreaseIndent}
            className="flex-1 p-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded"
            title="减少缩进"
          >
            <IndentDecrease className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={increaseIndent}
            className="flex-1 p-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded"
            title="增加缩进"
          >
            <IndentIncrease className="w-4 h-4 mx-auto" />
          </button>
          <input
            type="number"
            min="0"
            max="200"
            value={settings.indent}
            onChange={(e) => applySettings({ indent: Number(e.target.value) })}
            className="w-16 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center"
          />
          <span className="text-xs text-gray-400 self-center">px</span>
        </div>
      </div>

      {/* 首行缩进 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">首行缩进</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="-100"
            max="200"
            value={settings.firstLineIndent}
            onChange={(e) => applySettings({ firstLineIndent: Number(e.target.value) })}
            className="flex-1 h-1.5"
          />
          <input
            type="number"
            min="-100"
            max="200"
            value={settings.firstLineIndent}
            onChange={(e) => applySettings({ firstLineIndent: Number(e.target.value) })}
            className="w-14 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center"
          />
          <span className="text-xs text-gray-400">px</span>
        </div>
      </div>

      {/* 段落间距 */}
      <div className="space-y-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">段落间距</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] text-gray-400">段前</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={settings.spaceBefore}
                onChange={(e) => applySettings({ spaceBefore: Number(e.target.value) })}
                className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center"
              />
              <span className="text-[10px] text-gray-400">px</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-gray-400">段后</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={settings.spaceAfter}
                onChange={(e) => applySettings({ spaceAfter: Number(e.target.value) })}
                className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center"
              />
              <span className="text-[10px] text-gray-400">px</span>
            </div>
          </div>
        </div>
      </div>

      {/* 行距 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">行距</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={settings.lineHeight}
            onChange={(e) => applySettings({ lineHeight: Number(e.target.value) })}
            className="flex-1 h-1.5"
          />
          <input
            type="number"
            min="0.5"
            max="3"
            step="0.1"
            value={settings.lineHeight}
            onChange={(e) => applySettings({ lineHeight: Number(e.target.value) })}
            className="w-14 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center"
          />
        </div>
        <div className="flex gap-1 mt-1">
          {[1, 1.15, 1.5, 2, 2.5, 3].map(val => (
            <button
              key={val}
              onClick={() => applySettings({ lineHeight: val })}
              className={`flex-1 px-1 py-1 text-[10px] rounded ${settings.lineHeight === val ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* 列表类型 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">列表</span>
        <div className="flex gap-1">
          <button
            onClick={() => applySettings({ listType: 'none' })}
            className={`flex-1 px-2 py-1.5 text-xs rounded ${settings.listType === 'none' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            无
          </button>
          <button
            onClick={() => applySettings({ listType: 'bullet' })}
            className={`flex-1 p-1.5 rounded ${settings.listType === 'bullet' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            title="项目符号"
          >
            <List className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => applySettings({ listType: 'numbered' })}
            className={`flex-1 p-1.5 rounded ${settings.listType === 'numbered' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            title="编号列表"
          >
            <ListOrdered className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>

      {/* 文字方向 */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">文字方向</span>
        <div className="flex gap-1">
          <button
            onClick={() => applySettings({ direction: 'ltr' })}
            className={`flex-1 px-2 py-1.5 text-xs rounded ${settings.direction === 'ltr' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            从左到右
          </button>
          <button
            onClick={() => applySettings({ direction: 'rtl' })}
            className={`flex-1 px-2 py-1.5 text-xs rounded ${settings.direction === 'rtl' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            从右到左
          </button>
        </div>
      </div>

      {/* 连字符 */}
      <div className="flex items-center justify-between py-2 border-t border-gray-700">
        <span className="text-xs text-gray-400">自动连字符</span>
        <button
          onClick={() => applySettings({ hyphenation: !settings.hyphenation })}
          className={`w-10 h-5 rounded-full relative transition-colors ${settings.hyphenation ? 'bg-blue-600' : 'bg-gray-600'}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.hyphenation ? 'left-5' : 'left-0.5'}`} />
        </button>
      </div>

      {/* 重置按钮 */}
      <button
        onClick={() => {
          setSettings(defaultSettings);
          applySettings(defaultSettings);
        }}
        className="w-full py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded flex items-center justify-center gap-1"
      >
        <RotateCcw className="w-3 h-3" />
        重置为默认
      </button>
    </div>
  );
};

export default ParagraphPanel;
