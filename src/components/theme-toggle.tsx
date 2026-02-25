"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";

export function ThemeToggle() {
  const { mode, setMode } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setMode("light")}
        className={`px-3 py-1.5 text-sm rounded border transition-all ${
          mode === "light"
            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
            : "bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--primary)]"
        }`}
      >
        ☀️ 浅色
      </button>
      <button
        onClick={() => setMode("dark")}
        className={`px-3 py-1.5 text-sm rounded border transition-all ${
          mode === "dark"
            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
            : "bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--primary)]"
        }`}
      >
        🌙 深色
      </button>
    </div>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  return <>{children}</>;
}
