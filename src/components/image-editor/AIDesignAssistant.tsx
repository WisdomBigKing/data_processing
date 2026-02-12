'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { Sparkles, Palette, Type, Layout, Wand2, Loader2, Copy, Check, RefreshCw } from 'lucide-react';

interface AIGeneratedContent {
  type: 'colors' | 'text' | 'layout' | 'suggestion';
  content: string | string[];
  applied?: boolean;
}

export const AIDesignAssistant: React.FC = () => {
  const { canvas, setForegroundColor, addToHistory, updateLayers } = useEditorStore();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<AIGeneratedContent | null>(null);
  const [activeMode, setActiveMode] = useState<'colors' | 'text' | 'layout' | 'suggestion'>('colors');
  const [copied, setCopied] = useState(false);

  // 颜色生成预设
  const colorPrompts = [
    '科技感蓝紫色调',
    '温暖的秋季色彩',
    '清新自然绿色系',
    '优雅的莫兰迪色',
    '活力橙红撞色',
    '极简黑白灰',
  ];

  // 文案生成预设
  const textPrompts = [
    '产品宣传语',
    '活动标题',
    'Logo标语',
    '广告文案',
  ];

  // 调用后端AI Agent生成内容
  const generateWithAI = async () => {
    if (!prompt.trim()) {
      alert('请输入描述');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      // 构建针对不同模式的提示词
      let systemPrompt = '';
      let userPrompt = prompt;

      switch (activeMode) {
        case 'colors':
          systemPrompt = '你是一个专业的色彩设计师。根据用户描述生成5-7个和谐的配色方案。只返回十六进制颜色代码，每行一个，格式如：#FF5733。不要返回其他文字。';
          userPrompt = `请为"${prompt}"主题生成配色方案`;
          break;
        case 'text':
          systemPrompt = '你是一个专业的广告文案撰写师。根据用户需求生成简洁有力的文案。返回3-5条备选文案，每行一条。';
          userPrompt = `请为"${prompt}"生成文案`;
          break;
        case 'layout':
          systemPrompt = '你是一个专业的平面设计师。根据用户描述提供布局建议，包括元素排列、空间分配、视觉层次等方面的具体建议。';
          userPrompt = `请为"${prompt}"提供布局设计建议`;
          break;
        case 'suggestion':
          systemPrompt = '你是一个资深的视觉设计顾问。根据用户的设计需求提供专业的改进建议，包括配色、排版、构图等方面。';
          userPrompt = prompt;
          break;
      }

      // 调用后端AI接口
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        // 如果API不可用，使用本地模拟
        const mockResult = generateMockContent(activeMode, prompt);
        setGeneratedContent(mockResult);
        return;
      }

      const data = await response.json();
      const aiResponse = data.response || data.content || '';

      // 解析AI响应
      if (activeMode === 'colors') {
        const colors = aiResponse.match(/#[0-9A-Fa-f]{6}/g) || [];
        setGeneratedContent({
          type: 'colors',
          content: colors.length > 0 ? colors : generateMockColors(prompt),
        });
      } else {
        setGeneratedContent({
          type: activeMode,
          content: aiResponse,
        });
      }

    } catch (error) {
      console.error('AI generation error:', error);
      // 使用本地模拟作为fallback
      const mockResult = generateMockContent(activeMode, prompt);
      setGeneratedContent(mockResult);
    } finally {
      setIsGenerating(false);
    }
  };

  // 本地模拟生成（当API不可用时）
  const generateMockContent = (mode: string, input: string): AIGeneratedContent => {
    switch (mode) {
      case 'colors':
        return { type: 'colors', content: generateMockColors(input) };
      case 'text':
        return { type: 'text', content: generateMockText(input) };
      case 'layout':
        return { type: 'layout', content: generateMockLayout(input) };
      default:
        return { type: 'suggestion', content: generateMockSuggestion(input) };
    }
  };

  // 模拟颜色生成
  const generateMockColors = (input: string): string[] => {
    const colorSets: Record<string, string[]> = {
      '科技': ['#0066FF', '#00D4FF', '#6366F1', '#8B5CF6', '#1E1B4B', '#F8FAFC'],
      '温暖': ['#F59E0B', '#F97316', '#EF4444', '#FCD34D', '#FEF3C7', '#7C2D12'],
      '自然': ['#10B981', '#34D399', '#6EE7B7', '#047857', '#F0FDF4', '#365314'],
      '优雅': ['#9CA3AF', '#D1D5DB', '#E5E7EB', '#6B7280', '#F9FAFB', '#78716C'],
      '活力': ['#F97316', '#EF4444', '#FBBF24', '#10B981', '#3B82F6', '#1F2937'],
      default: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
    };

    for (const key of Object.keys(colorSets)) {
      if (input.includes(key)) {
        return colorSets[key];
      }
    }
    return colorSets.default;
  };

  // 模拟文案生成
  const generateMockText = (input: string): string => {
    const templates = [
      `探索${input}的无限可能`,
      `${input}，让创意绽放`,
      `用${input}定义未来`,
      `${input}，品质之选`,
      `感受${input}的魅力`,
    ];
    return templates.join('\n');
  };

  // 模拟布局建议
  const generateMockLayout = (input: string): string => {
    return `针对"${input}"的布局建议：

1. **视觉层次**：主标题置于画面上方1/3处，使用大字号突出
2. **空间分配**：留白占比30%，保持画面呼吸感
3. **元素排列**：采用Z型或F型阅读动线
4. **色彩搭配**：主色占60%，辅助色30%，强调色10%
5. **对齐方式**：建议使用网格系统，保持元素间距一致`;
  };

  // 模拟设计建议
  const generateMockSuggestion = (input: string): string => {
    return `针对您的设计需求，以下是专业建议：

1. **配色优化**：建议采用互补色或类似色方案，增强视觉冲击力
2. **字体选择**：标题使用无衬线字体，正文使用衬线字体增强可读性
3. **构图平衡**：注意元素的视觉重量分布，保持画面平衡
4. **留白处理**：适当增加留白，避免信息过载
5. **一致性**：保持风格、色彩、字体的统一性`;
  };

  // 应用颜色到画布
  const applyColor = (color: string) => {
    setForegroundColor(color);
    if (canvas) {
      const activeObj = canvas.getActiveObject();
      if (activeObj) {
        activeObj.set('fill', color);
        canvas.renderAll();
        addToHistory(JSON.stringify(canvas.toJSON()));
      }
    }
  };

  // 复制内容
  const copyContent = () => {
    if (!generatedContent) return;
    const text = Array.isArray(generatedContent.content) 
      ? generatedContent.content.join('\n')
      : generatedContent.content;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-500" />
        AI 设计助手
      </h3>

      {/* 模式选择 */}
      <div className="grid grid-cols-4 gap-1 mb-4">
        {[
          { mode: 'colors', icon: <Palette className="w-4 h-4" />, label: '配色' },
          { mode: 'text', icon: <Type className="w-4 h-4" />, label: '文案' },
          { mode: 'layout', icon: <Layout className="w-4 h-4" />, label: '布局' },
          { mode: 'suggestion', icon: <Wand2 className="w-4 h-4" />, label: '建议' },
        ].map(({ mode, icon, label }) => (
          <button
            key={mode}
            onClick={() => setActiveMode(mode as typeof activeMode)}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              activeMode === mode ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {icon}
            <span className="text-[10px] mt-1">{label}</span>
          </button>
        ))}
      </div>

      {/* 快捷提示词 */}
      {activeMode === 'colors' && (
        <div className="mb-3">
          <span className="text-xs text-gray-500 block mb-1">快捷选择</span>
          <div className="flex flex-wrap gap-1">
            {colorPrompts.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-purple-100 rounded"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeMode === 'text' && (
        <div className="mb-3">
          <span className="text-xs text-gray-500 block mb-1">快捷选择</span>
          <div className="flex flex-wrap gap-1">
            {textPrompts.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-purple-100 rounded"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            activeMode === 'colors' ? '描述你想要的配色风格...' :
            activeMode === 'text' ? '描述你需要的文案类型...' :
            activeMode === 'layout' ? '描述你的设计需求...' :
            '描述你需要的设计建议...'
          }
          className="w-full h-20 text-sm border rounded-lg px-3 py-2 resize-none"
        />
      </div>

      {/* 生成按钮 */}
      <button
        onClick={generateWithAI}
        disabled={isGenerating || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {isGenerating ? 'AI 生成中...' : 'AI 生成'}
      </button>

      {/* 生成结果 */}
      {generatedContent && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">生成结果</span>
            <div className="flex gap-1">
              <button
                onClick={copyContent}
                className="p-1 hover:bg-gray-200 rounded"
                title="复制"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={generateWithAI}
                className="p-1 hover:bg-gray-200 rounded"
                title="重新生成"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 颜色结果 */}
          {generatedContent.type === 'colors' && Array.isArray(generatedContent.content) && (
            <div className="grid grid-cols-6 gap-2">
              {generatedContent.content.map((color, i) => (
                <button
                  key={i}
                  onClick={() => applyColor(color)}
                  className="aspect-square rounded-lg border-2 border-white shadow hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={`${color} - 点击应用`}
                />
              ))}
            </div>
          )}

          {/* 文本结果 */}
          {(generatedContent.type === 'text' || 
            generatedContent.type === 'layout' || 
            generatedContent.type === 'suggestion') && (
            <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {generatedContent.content}
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-3 text-center">
        AI 生成内容仅供参考，可根据需要调整
      </p>
    </div>
  );
};

export default AIDesignAssistant;
