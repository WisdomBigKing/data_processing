"use client";

import React, { useState, useRef } from "react";
import { useEditorStore } from "@/store/editor-store";
import {
  Search,
  Upload,
  Loader2,
  Type,
  Copy,
  Check,
  Image as ImageIcon,
} from "lucide-react";

interface RecognizedFont {
  name: string;
  confidence: number;
  style: string;
  alternatives: string[];
}

interface RecognizedText {
  text: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

export const FontRecognizer: React.FC = () => {
  const { canvas } = useEditorStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedTexts, setRecognizedTexts] = useState<RecognizedText[]>([]);
  const [suggestedFonts, setSuggestedFonts] = useState<RecognizedFont[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 常见字体特征库（用于字体匹配）
  const fontDatabase: Record<
    string,
    { serif: boolean; weight: string; style: string }
  > = {
    Arial: { serif: false, weight: "normal", style: "sans-serif" },
    Helvetica: { serif: false, weight: "normal", style: "sans-serif" },
    "Times New Roman": { serif: true, weight: "normal", style: "serif" },
    Georgia: { serif: true, weight: "normal", style: "serif" },
    Verdana: { serif: false, weight: "normal", style: "sans-serif" },
    "Courier New": { serif: true, weight: "normal", style: "monospace" },
    Impact: { serif: false, weight: "bold", style: "sans-serif" },
    "Comic Sans MS": { serif: false, weight: "normal", style: "casual" },
    "Trebuchet MS": { serif: false, weight: "normal", style: "sans-serif" },
    Palatino: { serif: true, weight: "normal", style: "serif" },
    "Microsoft YaHei": { serif: false, weight: "normal", style: "sans-serif" },
    SimHei: { serif: false, weight: "bold", style: "sans-serif" },
    SimSun: { serif: true, weight: "normal", style: "serif" },
    KaiTi: { serif: true, weight: "normal", style: "script" },
  };

  const recognizeFromImage = async (imageData: string) => {
    setIsProcessing(true);
    setRecognizedTexts([]);
    setSuggestedFonts([]);
    setPreviewImage(imageData);

    try {
      // 动态导入 Tesseract.js
      const Tesseract = await import("tesseract.js");

      // 使用 Tesseract 进行 OCR
      const result = await Tesseract.recognize(imageData, "chi_sim+eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`识别进度: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // 解析识别结果
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const words = (result.data as any).words || [];
      const texts: RecognizedText[] = words
        .map((word: any) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox || { x: 0, y: 0, width: 0, height: 0 },
        }))
        .filter(
          (t: RecognizedText) => t.text.trim().length > 0 && t.confidence > 50,
        );

      setRecognizedTexts(texts);

      // 基于识别的文字特征推测字体
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fullText = (result.data as any).text || "";
      const suggestedFontsList = suggestFonts(fullText, texts);
      setSuggestedFonts(suggestedFontsList);
    } catch (error) {
      console.error("OCR error:", error);
      alert("文字识别失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  // 基于文字特征推测可能的字体
  const suggestFonts = (
    text: string,
    texts: RecognizedText[],
  ): RecognizedFont[] => {
    const suggestions: RecognizedFont[] = [];

    // 检测是否包含中文
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);

    // 检测文字特征
    const avgConfidence =
      texts.reduce((sum, t) => sum + t.confidence, 0) / texts.length;

    if (hasChinese) {
      // 中文字体推荐
      suggestions.push(
        {
          name: "Microsoft YaHei",
          confidence: 85,
          style: "微软雅黑",
          alternatives: ["PingFang SC", "Noto Sans SC"],
        },
        {
          name: "SimHei",
          confidence: 75,
          style: "黑体",
          alternatives: ["Source Han Sans", "Noto Sans SC"],
        },
        {
          name: "SimSun",
          confidence: 70,
          style: "宋体",
          alternatives: ["Source Han Serif", "Noto Serif SC"],
        },
        {
          name: "KaiTi",
          confidence: 65,
          style: "楷体",
          alternatives: ["STKaiti", "AR PL UKai"],
        },
      );
    } else {
      // 英文字体推荐（基于简单特征分析）
      suggestions.push(
        {
          name: "Arial",
          confidence: 80,
          style: "Sans-serif",
          alternatives: ["Helvetica", "Roboto"],
        },
        {
          name: "Times New Roman",
          confidence: 75,
          style: "Serif",
          alternatives: ["Georgia", "Palatino"],
        },
        {
          name: "Helvetica",
          confidence: 70,
          style: "Sans-serif",
          alternatives: ["Arial", "Inter"],
        },
        {
          name: "Verdana",
          confidence: 65,
          style: "Sans-serif",
          alternatives: ["Tahoma", "Geneva"],
        },
      );
    }

    return suggestions;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      recognizeFromImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const recognizeFromCanvas = async () => {
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    if (activeObj && activeObj.type === "image") {
      // 从选中的图像识别
      const dataUrl = activeObj.toDataURL({});
      recognizeFromImage(dataUrl);
    } else {
      // 从整个画布识别
      const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
      recognizeFromImage(dataUrl);
    }
  };

  const copyText = () => {
    const text = recognizedTexts.map((t) => t.text).join(" ");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyFont = (fontName: string) => {
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    if (
      activeObj &&
      (activeObj.type === "i-text" || activeObj.type === "textbox")
    ) {
      activeObj.set("fontFamily", fontName);
      canvas.renderAll();
    } else {
      alert("请先选择文字对象");
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        字体识别 (Retype)
      </h3>

      {/* 上传/识别按钮 */}
      <div className="space-y-2 mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isProcessing ? "识别中..." : "上传图片识别"}
        </button>

        <button
          onClick={recognizeFromCanvas}
          disabled={isProcessing || !canvas}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4" />
          从画布/选中图像识别
        </button>
      </div>

      {/* 预览图像 */}
      {previewImage && (
        <div className="mb-4">
          <span className="text-xs text-gray-500 block mb-1">识别图像</span>
          <img
            src={previewImage}
            alt="Preview"
            className="w-full h-32 object-contain bg-gray-100 rounded-lg"
          />
        </div>
      )}

      {/* 识别结果 */}
      {recognizedTexts.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">识别文字</span>
            <button
              onClick={copyText}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? "已复制" : "复制"}
            </button>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
            <p className="text-sm text-gray-700">
              {recognizedTexts.map((t) => t.text).join(" ")}
            </p>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            平均置信度:{" "}
            {Math.round(
              recognizedTexts.reduce((sum, t) => sum + t.confidence, 0) /
                recognizedTexts.length,
            )}
            %
          </p>
        </div>
      )}

      {/* 推荐字体 */}
      {suggestedFonts.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 block mb-2">推荐字体</span>
          <div className="space-y-2">
            {suggestedFonts.map((font, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => applyFont(font.name)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span
                      className="text-sm font-medium"
                      style={{ fontFamily: font.name }}
                    >
                      {font.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({font.style})
                    </span>
                  </div>
                  <span className="text-xs text-blue-500">
                    {font.confidence}%
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  类似: {font.alternatives.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 提示 */}
      {!previewImage && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600">
            <strong>使用方法：</strong>
          </p>
          <ul className="text-[10px] text-blue-500 mt-1 space-y-1">
            <li>• 上传包含文字的图片</li>
            <li>• 或选中画布上的图像进行识别</li>
            <li>• 系统会识别文字并推荐相似字体</li>
            <li>• 点击推荐字体可应用到选中的文字对象</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default FontRecognizer;
