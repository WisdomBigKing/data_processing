"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

// 管理员用户名
const ADMIN_USER_NAME = "卢金旭";

const navItems = [
  { title: "首页", href: "/dashboard", icon: "🏠" },
  { title: "文件", href: "/files", icon: "📁" },
  { title: "任务", href: "/tasks", icon: "📋" },
  { title: "报告", href: "/report-generator", icon: "🪄" },
  { title: "分析", href: "/data-analysis", icon: "📊" },
  { title: "设置", href: "/settings", icon: "⚙️" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // 判断是否为管理员
  const isAdmin = user?.name === ADMIN_USER_NAME;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[var(--card)] border-t border-[var(--border)]">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-0.5 text-[10px] font-medium transition-all",
                isActive
                  ? "text-[var(--primary)]"
                  : "text-[var(--foreground)] opacity-50 hover:opacity-100",
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.title}</span>
            </Link>
          );
        })}

        {/* 用户管理 - 仅管理员可见 */}
        {isAdmin && (
          <Link
            href="/users"
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-0.5 text-[10px] font-medium transition-all",
              pathname === "/users" || pathname.startsWith("/users/")
                ? "text-[var(--primary)]"
                : "text-[var(--foreground)] opacity-50 hover:opacity-100",
            )}
          >
            <span className="text-lg">👥</span>
            <span>用户</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
