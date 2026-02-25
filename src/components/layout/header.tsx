"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import { useEffect } from "react";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { mode, setMode } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      logout();
      router.push("/login");
    } catch (error) {
      console.error("登出失败:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:animate-pulse">🚀</span>
            <span className="text-xl font-bold text-[var(--primary)]">
              神奇妙妙屋
            </span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-sm font-medium text-[var(--foreground)] opacity-70 hover:opacity-100 hover:text-[var(--primary)] hover:bg-[var(--muted)] rounded transition-all"
              >
                控制台
              </Link>
              <Link
                href="/files"
                className="px-3 py-1.5 text-sm font-medium text-[var(--foreground)] opacity-70 hover:opacity-100 hover:text-[var(--primary)] hover:bg-[var(--muted)] rounded transition-all"
              >
                文件库
              </Link>
              <Link
                href="/tasks"
                className="px-3 py-1.5 text-sm font-medium text-[var(--foreground)] opacity-70 hover:opacity-100 hover:text-[var(--primary)] hover:bg-[var(--muted)] rounded transition-all"
              >
                任务
              </Link>
              <Link
                href="/reports"
                className="px-3 py-1.5 text-sm font-medium text-[var(--foreground)] opacity-70 hover:opacity-100 hover:text-[var(--primary)] hover:bg-[var(--muted)] rounded transition-all"
              >
                报告
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* 主题切换 */}
          <div className="flex items-center gap-1 bg-[var(--muted)] rounded-lg p-1">
            <button
              onClick={() => setMode("light")}
              className={`px-2 py-1 text-xs rounded transition-all ${
                mode === "light"
                  ? "bg-[var(--card)] text-[var(--primary)] shadow-sm"
                  : "text-[var(--foreground)] opacity-60 hover:opacity-100"
              }`}
            >
              ☀️ 浅色
            </button>
            <button
              onClick={() => setMode("dark")}
              className={`px-2 py-1 text-xs rounded transition-all ${
                mode === "dark"
                  ? "bg-[var(--card)] text-[var(--primary)] shadow-sm"
                  : "text-[var(--foreground)] opacity-60 hover:opacity-100"
              }`}
            >
              🌙 深色
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold text-sm">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {user.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-medium rounded border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:border-[var(--error)] hover:text-[var(--error)] transition-all"
              >
                退出
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <button className="px-4 py-2 text-sm font-bold rounded bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white hover:opacity-90 transition-all">
                  登录
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
