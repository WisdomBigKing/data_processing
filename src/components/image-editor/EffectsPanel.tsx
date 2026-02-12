"use client";

import React, { useState, useEffect } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/store/editor-store";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface Effect {
  id: string;
  type:
    | "dropShadow"
    | "innerShadow"
    | "outerGlow"
    | "innerGlow"
    | "blur"
    | "bevel";
  enabled: boolean;
  settings: Record<string, number | string>;
}

const defaultEffects: Record<string, Effect["settings"]> = {
  dropShadow: {
    offsetX: 4,
    offsetY: 4,
    blur: 8,
    spread: 0,
    color: "#000000",
    opacity: 0.5,
  },
  innerShadow: {
    offsetX: 2,
    offsetY: 2,
    blur: 4,
    color: "#000000",
    opacity: 0.5,
  },
  outerGlow: { blur: 10, spread: 2, color: "#FFD700", opacity: 0.7 },
  innerGlow: { blur: 10, color: "#FFFFFF", opacity: 0.7 },
  blur: { radius: 5 },
  bevel: { depth: 5, softness: 3, angle: 135 },
};

const effectNames: Record<string, string> = {
  dropShadow: "投影",
  innerShadow: "内阴影",
  outerGlow: "外发光",
  innerGlow: "内发光",
  blur: "高斯模糊",
  bevel: "斜角和浮雕",
};

interface EffectItemProps {
  effect: Effect;
  onUpdate: (effect: Effect) => void;
  onRemove: () => void;
}

const EffectItem: React.FC<EffectItemProps> = ({
  effect,
  onUpdate,
  onRemove,
}) => {
  const [expanded, setExpanded] = useState(true);

  const handleSettingChange = (key: string, value: number | string) => {
    onUpdate({
      ...effect,
      settings: { ...effect.settings, [key]: value },
    });
  };

  const renderSettings = () => {
    switch (effect.type) {
      case "dropShadow":
      case "innerShadow":
        return (
          <div className="space-y-2 pl-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">颜色</span>
              <input
                type="color"
                value={effect.settings.color as string}
                onChange={(e) => handleSettingChange("color", e.target.value)}
                className="w-6 h-6 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">X偏移</span>
              <input
                type="range"
                min="-50"
                max="50"
                value={effect.settings.offsetX as number}
                onChange={(e) =>
                  handleSettingChange("offsetX", Number(e.target.value))
                }
                className="flex-1"
              />
              <span className="text-xs w-8">{effect.settings.offsetX}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">Y偏移</span>
              <input
                type="range"
                min="-50"
                max="50"
                value={effect.settings.offsetY as number}
                onChange={(e) =>
                  handleSettingChange("offsetY", Number(e.target.value))
                }
                className="flex-1"
              />
              <span className="text-xs w-8">{effect.settings.offsetY}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">模糊</span>
              <input
                type="range"
                min="0"
                max="50"
                value={effect.settings.blur as number}
                onChange={(e) =>
                  handleSettingChange("blur", Number(e.target.value))
                }
                className="flex-1"
              />
              <span className="text-xs w-8">{effect.settings.blur}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">透明度</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={effect.settings.opacity as number}
                onChange={(e) =>
                  handleSettingChange("opacity", Number(e.target.value))
                }
                className="flex-1"
              />
              <span className="text-xs w-8">
                {Math.round((effect.settings.opacity as number) * 100)}%
              </span>
            </div>
          </div>
        );
      case "outerGlow":
      case "innerGlow":
        return (
          <div className="space-y-2 pl-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">颜色</span>
              <input
                type="color"
                value={effect.settings.color as string}
                onChange={(e) => handleSettingChange("color", e.target.value)}
                className="w-6 h-6 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">模糊</span>
              <input
                type="range"
                min="0"
                max="50"
                value={effect.settings.blur as number}
                onChange={(e) =>
                  handleSettingChange("blur", Number(e.target.value))
                }
                className="flex-1"
              />
              <span className="text-xs w-8">{effect.settings.blur}</span>
            </div>
            {effect.type === "outerGlow" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16">扩展</span>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={effect.settings.spread as number}
                  onChange={(e) =>
                    handleSettingChange("spread", Number(e.target.value))
                  }
                  className="flex-1"
                />
                <span className="text-xs w-8">{effect.settings.spread}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">透明度</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={effect.settings.opacity as number}
                onChange={(e) =>
                  handleSettingChange("opacity", Number(e.target.value))
                }
                className="flex-1"
              />
              <span className="text-xs w-8">
                {Math.round((effect.settings.opacity as number) * 100)}%
              </span>
            </div>
          </div>
        );
      case "blur":
        return (
          <div className="space-y-2 pl-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">半径</span>
              <input
                type="range"
                min="0"
                max="50"
                value={effect.settings.radius as number}
                onChange={(e) =>
                  handleSettingChange("radius", Number(e.target.value))
                }
                className="flex-1"
              />
              <span className="text-xs w-8">{effect.settings.radius}</span>
            </div>
          </div>
        );
      case "bevel":
        return (
          <div className="space-y-2 pl-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">深度</span>
              <input
                type="range"
                min="1"
                max="20"
                value={effect.settings.depth as number}
                onChange={(e) =>
                  handleSettingChange("depth", Number(e.target.value))
                }
                className="flex-1"
              />
              <span className="text-xs w-8">{effect.settings.depth}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">柔和度</span>
              <input
                type="range"
                min="0"
                max="10"
                value={effect.settings.softness as number}
                onChange={(e) =>
                  handleSettingChange("softness", Number(e.target.value))
                }
                className="flex-1"
              />
              <span className="text-xs w-8">{effect.settings.softness}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">角度</span>
              <input
                type="range"
                min="0"
                max="360"
                value={effect.settings.angle as number}
                onChange={(e) =>
                  handleSettingChange("angle", Number(e.target.value))
                }
                className="flex-1"
              />
              <span className="text-xs w-8">{effect.settings.angle}°</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg mb-2">
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-t-lg">
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 hover:bg-gray-200 rounded"
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => onUpdate({ ...effect, enabled: !effect.enabled })}
          className="p-0.5 hover:bg-gray-200 rounded"
        >
          {effect.enabled ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
        </button>
        <span
          className={`flex-1 text-sm ${effect.enabled ? "text-gray-700" : "text-gray-400"}`}
        >
          {effectNames[effect.type]}
        </span>
        <button
          onClick={onRemove}
          className="p-0.5 hover:bg-red-100 rounded text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {expanded && effect.enabled && (
        <div className="p-2">{renderSettings()}</div>
      )}
    </div>
  );
};

export const EffectsPanel: React.FC = () => {
  const { canvas, activeObject, addToHistory } = useEditorStore();
  const [effects, setEffects] = useState<Effect[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // 从对象加载效果
  useEffect(() => {
    if (activeObject) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objEffects = (activeObject as any).__effects || [];
      setEffects(objEffects);
    } else {
      setEffects([]);
    }
  }, [activeObject]);

  const applyEffects = (newEffects: Effect[]) => {
    if (!canvas || !activeObject) return;

    // 保存效果到对象
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (activeObject as any).__effects = newEffects;

    // 应用Fabric.js滤镜/阴影
    const enabledEffects = newEffects.filter((e) => e.enabled);

    // 清除现有阴影
    activeObject.shadow = null;

    // 应用投影效果
    const dropShadow = enabledEffects.find((e) => e.type === "dropShadow");
    if (dropShadow) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activeObject.shadow = new (fabric as any).Shadow({
        color: `${dropShadow.settings.color}${Math.round(
          (dropShadow.settings.opacity as number) * 255,
        )
          .toString(16)
          .padStart(2, "0")}`,
        blur: dropShadow.settings.blur as number,
        offsetX: dropShadow.settings.offsetX as number,
        offsetY: dropShadow.settings.offsetY as number,
      });
    }

    // 外发光（使用阴影模拟）
    const outerGlow = enabledEffects.find((e) => e.type === "outerGlow");
    if (outerGlow && !dropShadow) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activeObject.shadow = new (fabric as any).Shadow({
        color: `${outerGlow.settings.color}${Math.round(
          (outerGlow.settings.opacity as number) * 255,
        )
          .toString(16)
          .padStart(2, "0")}`,
        blur: outerGlow.settings.blur as number,
        offsetX: 0,
        offsetY: 0,
      });
    }

    canvas.renderAll();
    setEffects(newEffects);
  };

  const addEffect = (type: Effect["type"]) => {
    const newEffect: Effect = {
      id: `effect-${Date.now()}`,
      type,
      enabled: true,
      settings: { ...defaultEffects[type] },
    };
    applyEffects([...effects, newEffect]);
    setShowAddMenu(false);
  };

  const updateEffect = (updatedEffect: Effect) => {
    const newEffects = effects.map((e) =>
      e.id === updatedEffect.id ? updatedEffect : e,
    );
    applyEffects(newEffects);
  };

  const removeEffect = (id: string) => {
    const newEffects = effects.filter((e) => e.id !== id);
    applyEffects(newEffects);
    addToHistory(JSON.stringify(canvas?.toJSON()));
  };

  if (!activeObject) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">效果</h3>
        <p className="text-xs text-gray-400 text-center">请选择一个对象</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">效果</h3>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="p-1 hover:bg-gray-100 rounded"
            title="添加效果"
          >
            <Plus className="w-4 h-4" />
          </button>
          {showAddMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                {Object.entries(effectNames).map(([type, name]) => (
                  <button
                    key={type}
                    onClick={() => addEffect(type as Effect["type"])}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {effects.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">
          点击 + 添加效果
        </p>
      ) : (
        effects.map((effect) => (
          <EffectItem
            key={effect.id}
            effect={effect}
            onUpdate={updateEffect}
            onRemove={() => removeEffect(effect.id)}
          />
        ))
      )}

      {/* 预设效果 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <span className="text-xs text-gray-500 block mb-2">快速预设</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              applyEffects([
                {
                  id: `effect-${Date.now()}`,
                  type: "dropShadow",
                  enabled: true,
                  settings: {
                    offsetX: 4,
                    offsetY: 4,
                    blur: 10,
                    color: "#000000",
                    opacity: 0.3,
                  },
                },
              ]);
            }}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            柔和阴影
          </button>
          <button
            onClick={() => {
              applyEffects([
                {
                  id: `effect-${Date.now()}`,
                  type: "dropShadow",
                  enabled: true,
                  settings: {
                    offsetX: 0,
                    offsetY: 8,
                    blur: 20,
                    color: "#000000",
                    opacity: 0.4,
                  },
                },
              ]);
            }}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            悬浮效果
          </button>
          <button
            onClick={() => {
              applyEffects([
                {
                  id: `effect-${Date.now()}`,
                  type: "outerGlow",
                  enabled: true,
                  settings: {
                    blur: 15,
                    spread: 5,
                    color: "#00D4FF",
                    opacity: 0.8,
                  },
                },
              ]);
            }}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            霓虹发光
          </button>
          <button
            onClick={() => {
              applyEffects([
                {
                  id: `effect-${Date.now()}`,
                  type: "outerGlow",
                  enabled: true,
                  settings: {
                    blur: 20,
                    spread: 0,
                    color: "#FFD700",
                    opacity: 0.6,
                  },
                },
              ]);
            }}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            金色光芒
          </button>
        </div>
      </div>
    </div>
  );
};

export default EffectsPanel;
