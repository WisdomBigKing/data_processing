'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDataAnalysisStore } from '@/store/data-analysis-store';
import { ChartRenderer } from './ChartRenderer';
import type { ChatMessage, ChartConfig } from './types';
import { CHART_TYPES } from './types';
import { v4 as uuidv4 } from 'uuid';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  BarChart3,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';

interface ChatInterfaceProps {
  onAnalyze: (prompt: string, chartType?: ChartConfig['type']) => Promise<void>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onAnalyze }) => {
  const {
    chatMessages,
    addChatMessage,
    clearChatMessages,
    isAnalyzing,
    files,
    selectedFileIds,
  } = useDataAnalysisStore();

  const [inputValue, setInputValue] = useState('');
  const [selectedChartType, setSelectedChartType] = useState<ChartConfig['type']>('bar');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedFiles = files.filter((f) => selectedFileIds.includes(f.id));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isAnalyzing) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    addChatMessage(userMessage);
    setInputValue('');

    await onAnalyze(inputValue, selectedChartType);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickPrompts = [
    '对比所有数据的总体趋势',
    '分析各类别的占比情况',
    '找出数值最高和最低的项目',
    '按时间维度分析变化趋势',
    '对比不同文件之间的差异',
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium text-gray-800">AI 数据分析助手</h3>
        </div>
        <button
          onClick={clearChatMessages}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          清空对话
        </button>
      </div>

      {/* Selected Files Info */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <FileSpreadsheet className="w-4 h-4" />
            <span>已选择 {selectedFiles.length} 个文件进行分析</span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto text-blue-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-800 mb-2">
              开始数据分析对话
            </h4>
            <p className="text-gray-500 mb-6">
              选择数据文件后，描述你想要分析的内容，AI将为你生成分析结果和图表
            </p>

            {/* Quick Prompts */}
            <div className="space-y-2">
              <p className="text-sm text-gray-400">快速开始:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(prompt)}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>正在分析数据...</span>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.chartData && (
                        <div className="mt-4">
                          <ChartRenderer
                            config={message.chartData.config}
                            data={message.chartData.data}
                            width={500}
                            height={350}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chart Type Selector */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <BarChart3 className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-500 flex-shrink-0">图表类型:</span>
          {CHART_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedChartType(type.value)}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
                selectedChartType === type.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedFiles.length === 0
                ? '请先选择要分析的数据文件...'
                : '描述你想要分析的内容，例如：对比各类别的销售额...'
            }
            disabled={selectedFiles.length === 0 || isAnalyzing}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            rows={2}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || selectedFiles.length === 0 || isAnalyzing}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
