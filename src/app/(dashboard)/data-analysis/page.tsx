'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const DataAnalysis = dynamic(
  () => import('@/components/data-analysis/DataAnalysis').then((mod) => mod.DataAnalysis),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-500">加载数据分析模块...</p>
        </div>
      </div>
    ),
  }
);

export default function DataAnalysisPage() {
  return (
    <div className="h-[calc(100vh-64px)]">
      <DataAnalysis />
    </div>
  );
}
