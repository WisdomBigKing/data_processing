'use client';

import React from 'react';
import { useEditorStore } from '@/store/editor-store';
import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
} from 'lucide-react';
import type { AlignType } from './types';

interface AlignButtonProps {
  type: AlignType;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const AlignButton: React.FC<AlignButtonProps> = ({ type, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center w-9 h-9 hover:bg-gray-100 rounded transition-colors"
    title={label}
  >
    {icon}
  </button>
);

export const AlignPanel: React.FC = () => {
  const { alignObjects, canvas } = useEditorStore();

  const handleAlign = (type: AlignType) => {
    if (!canvas) return;
    
    const activeObj = canvas.getActiveObject();
    if (!activeObj) {
      alert('请先选择对象');
      return;
    }
    
    alignObjects(type);
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">对齐</h3>
      
      {/* 水平对齐 */}
      <div className="mb-3">
        <span className="text-xs text-gray-500 block mb-2">水平对齐</span>
        <div className="flex gap-1">
          <AlignButton
            type="left"
            icon={<AlignHorizontalJustifyStart className="w-5 h-5" />}
            label="左对齐"
            onClick={() => handleAlign('left')}
          />
          <AlignButton
            type="centerH"
            icon={<AlignHorizontalJustifyCenter className="w-5 h-5" />}
            label="水平居中"
            onClick={() => handleAlign('centerH')}
          />
          <AlignButton
            type="right"
            icon={<AlignHorizontalJustifyEnd className="w-5 h-5" />}
            label="右对齐"
            onClick={() => handleAlign('right')}
          />
          <AlignButton
            type="distributeH"
            icon={<AlignHorizontalSpaceAround className="w-5 h-5" />}
            label="水平分布"
            onClick={() => handleAlign('distributeH')}
          />
        </div>
      </div>

      {/* 垂直对齐 */}
      <div>
        <span className="text-xs text-gray-500 block mb-2">垂直对齐</span>
        <div className="flex gap-1">
          <AlignButton
            type="top"
            icon={<AlignVerticalJustifyStart className="w-5 h-5" />}
            label="顶对齐"
            onClick={() => handleAlign('top')}
          />
          <AlignButton
            type="centerV"
            icon={<AlignVerticalJustifyCenter className="w-5 h-5" />}
            label="垂直居中"
            onClick={() => handleAlign('centerV')}
          />
          <AlignButton
            type="bottom"
            icon={<AlignVerticalJustifyEnd className="w-5 h-5" />}
            label="底对齐"
            onClick={() => handleAlign('bottom')}
          />
          <AlignButton
            type="distributeV"
            icon={<AlignVerticalSpaceAround className="w-5 h-5" />}
            label="垂直分布"
            onClick={() => handleAlign('distributeV')}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-[10px] text-gray-400">
          提示：选择多个对象后可进行对齐和分布操作
        </p>
      </div>
    </div>
  );
};

export default AlignPanel;
