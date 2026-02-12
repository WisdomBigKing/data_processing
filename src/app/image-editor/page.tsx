"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamic import to avoid SSR issues with fabric.js
const ImageEditorPro = dynamic(
  () =>
    import("@/components/image-editor/ImageEditorPro").then(
      (mod) => mod.ImageEditorPro,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-400 text-lg">加载矢量编辑器中...</p>
        </div>
      </div>
    ),
  },
);

export default function ImageEditorPage() {
  return <ImageEditorPro />;
}
