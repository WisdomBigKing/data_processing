"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ArticleResult {
  leadTitle: string; // 引题
  mainTitle: string; // 主题
  subTitle: string; // 副题
  summary: string; // 摘要
  tags: string[]; // 标签
  processedArticle: string; // 处理后的文章
}

export default function ArticleProcessorPage() {
  const [originalArticle, setOriginalArticle] = useState("");
  const [targetRequirement, setTargetRequirement] = useState("");
  const [result, setResult] = useState<ArticleResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"extract" | "process">("extract");

  // 生成文章标题和摘要
  const handleExtract = async () => {
    if (!originalArticle.trim()) {
      setError("请先粘贴文章内容");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/article/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article: originalArticle }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "生成失败");
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理文章
  const handleProcess = async () => {
    if (!originalArticle.trim()) {
      setError("请先粘贴文章内容");
      return;
    }
    if (!targetRequirement.trim()) {
      setError("请输入处理要求");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/article/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article: originalArticle,
          requirement: targetRequirement,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "处理失败");
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理失败");
    } finally {
      setIsProcessing(false);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          📝 文章处理
        </h1>
        <p className="text-[var(--foreground)] opacity-60 mt-1">
          使用AI生成文章标题和摘要，或按需求处理文章
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)] text-[var(--error)]">
          ⚠️ {error}
        </div>
      )}

      {/* 功能切换 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("extract")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "extract"
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)]"
          }`}
        >
          📋 生成标题
        </button>
        <button
          onClick={() => setActiveTab("process")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "process"
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)]"
          }`}
        >
          ✨ 处理文章
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle>原文输入</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                粘贴文章内容
              </label>
              <textarea
                value={originalArticle}
                onChange={(e) => setOriginalArticle(e.target.value)}
                placeholder="在此粘贴需要处理的文章..."
                className="w-full h-64 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] placeholder-gray-400 focus:border-[var(--primary)] focus:outline-none resize-none"
              />
              <p className="text-xs text-[var(--foreground)] opacity-40 mt-1">
                已输入 {originalArticle.length} 字
              </p>
            </div>

            {activeTab === "process" && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  处理要求
                </label>
                <textarea
                  value={targetRequirement}
                  onChange={(e) => setTargetRequirement(e.target.value)}
                  placeholder="例如：将文章改写为500字的新闻稿，保持原文核心内容不变..."
                  className="w-full h-24 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] placeholder-gray-400 focus:border-[var(--primary)] focus:outline-none resize-none"
                />
              </div>
            )}

            <button
              onClick={activeTab === "extract" ? handleExtract : handleProcess}
              disabled={isProcessing}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing
                ? "🔄 处理中..."
                : activeTab === "extract"
                  ? "📋 生成标题摘要"
                  : "✨ 开始处理"}
            </button>
          </CardContent>
        </Card>

        {/* 结果区域 */}
        <Card>
          <CardHeader>
            <CardTitle>处理结果</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📄</div>
                <p className="text-[var(--foreground)] opacity-50">
                  {activeTab === "extract"
                    ? "粘贴文章后点击生成，AI将自动生成引题、主题、副题和摘要"
                    : "输入文章和处理要求后，AI将按要求处理文章并生成标题"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 引题 */}
                <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--primary)]">
                      引题
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.leadTitle)}
                      className="text-xs text-[var(--foreground)] opacity-60 hover:opacity-100"
                    >
                      复制
                    </button>
                  </div>
                  <p className="text-[var(--foreground)]">
                    {result.leadTitle || "（无）"}
                  </p>
                </div>

                {/* 主题 */}
                <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--primary)]">
                      主题
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.mainTitle)}
                      className="text-xs text-[var(--foreground)] opacity-60 hover:opacity-100"
                    >
                      复制
                    </button>
                  </div>
                  <p className="text-[var(--foreground)] font-bold">
                    {result.mainTitle || "（无）"}
                  </p>
                </div>

                {/* 副题 */}
                <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--primary)]">
                      副题
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.subTitle)}
                      className="text-xs text-[var(--foreground)] opacity-60 hover:opacity-100"
                    >
                      复制
                    </button>
                  </div>
                  <p className="text-[var(--foreground)]">
                    {result.subTitle || "（无）"}
                  </p>
                </div>

                {/* 摘要 */}
                <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--primary)]">
                      摘要
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.summary)}
                      className="text-xs text-[var(--foreground)] opacity-60 hover:opacity-100"
                    >
                      复制
                    </button>
                  </div>
                  <p className="text-[var(--foreground)] text-sm leading-relaxed">
                    {result.summary || "（无）"}
                  </p>
                </div>

                {/* 标签 */}
                <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--primary)]">
                      标签
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(result.tags?.join(", ") || "")
                      }
                      className="text-xs text-[var(--foreground)] opacity-60 hover:opacity-100"
                    >
                      复制
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.tags && result.tags.length > 0 ? (
                      result.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm rounded-full bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[var(--foreground)] opacity-50">
                        （无）
                      </span>
                    )}
                  </div>
                </div>

                {/* 处理后的文章 */}
                {result.processedArticle && (
                  <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[var(--primary)]">
                        处理后的文章
                      </span>
                      <button
                        onClick={() => copyToClipboard(result.processedArticle)}
                        className="text-xs text-[var(--foreground)] opacity-60 hover:opacity-100"
                      >
                        复制
                      </button>
                    </div>
                    <p className="text-[var(--foreground)] text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {result.processedArticle}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
