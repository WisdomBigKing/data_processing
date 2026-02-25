"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, getStatusText, getStatusColor } from "@/lib/utils";

interface DashboardStats {
  totalFiles: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

interface RecentTask {
  id: string;
  name: string;
  status: string;
  progress: number;
  createdAt: string;
  file: {
    originalName: string;
  };
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalFiles: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [filesRes, tasksRes] = await Promise.all([
          fetch("/api/files"),
          fetch("/api/tasks"),
        ]);

        const filesData = await filesRes.json();
        const tasksData = await tasksRes.json();

        const tasks = tasksData.tasks || [];

        setStats({
          totalFiles: filesData.files?.length || 0,
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t: any) => t.status === "completed")
            .length,
          pendingTasks: tasks.filter(
            (t: any) => t.status === "pending" || t.status === "processing",
          ).length,
        });

        setRecentTasks(tasks.slice(0, 5));
      } catch (error) {
        console.error("获取数据失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: "文件总数",
      value: stats.totalFiles,
      icon: "📁",
      color: "from-[var(--primary)]/20 to-[var(--secondary)]/10",
    },
    {
      title: "任务总数",
      value: stats.totalTasks,
      icon: "📋",
      color: "from-[var(--secondary)]/20 to-[var(--accent)]/10",
    },
    {
      title: "已完成",
      value: stats.completedTasks,
      icon: "✅",
      color: "from-[var(--success)]/20 to-[var(--primary)]/10",
    },
    {
      title: "进行中",
      value: stats.pendingTasks,
      icon: "⏳",
      color: "from-[var(--warning)]/20 to-[var(--error)]/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-[var(--card)] border border-[var(--border)] rounded-lg">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            👋 欢迎回来，{user?.name}！
          </h1>
          <p className="text-[var(--foreground)] opacity-60 mt-1 text-sm">
            这是你的工作台，今天想做点什么呢？
          </p>
        </div>
        <Link href="/files">
          <button className="px-5 py-2.5 rounded bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium hover:opacity-90 transition-all">
            📤 上传文件
          </button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`relative p-6 bg-gradient-to-br ${stat.color} border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-all group overflow-hidden`}
          >
            <div className="relative flex items-center gap-4">
              <div className="text-3xl">{stat.icon}</div>
              <div>
                <p className="text-sm text-[var(--foreground)] opacity-60">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {isLoading ? "-" : stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-bold text-[var(--foreground)]">📋 最近任务</h3>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-[var(--primary)] animate-pulse">
                  加载中...
                </div>
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-[var(--foreground)] opacity-50">暂无任务</p>
                <Link href="/tasks">
                  <button className="mt-4 px-4 py-2 rounded border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-sm">
                    + 创建任务
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="flex items-center justify-between p-3 rounded border border-[var(--border)] hover:bg-[var(--muted)] hover:border-[var(--primary)] transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--foreground)] truncate text-sm">
                          {task.name}
                        </p>
                        <p className="text-xs text-[var(--foreground)] opacity-50 truncate">
                          📄 {task.file.originalName}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 text-xs font-medium rounded border border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary)]/10">
                          {getStatusText(task.status)}
                        </span>
                        <span className="text-xs text-[var(--foreground)] opacity-40">
                          {formatDate(task.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                <Link href="/tasks" className="block text-center pt-2">
                  <button className="text-[var(--primary)] text-sm">
                    查看全部任务 →
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-bold text-[var(--foreground)]">🚀 快捷操作</h3>
          </div>
          <div className="p-3 space-y-2">
            <Link href="/files" className="block">
              <div className="flex items-center gap-3 p-3 rounded border border-[var(--border)] hover:bg-[var(--muted)] hover:border-[var(--primary)] transition-all">
                <div className="text-xl">📤</div>
                <div>
                  <p className="font-medium text-[var(--foreground)] text-sm">
                    上传文件
                  </p>
                  <p className="text-xs text-[var(--foreground)] opacity-40">
                    上传数据文件进行分析
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/tasks" className="block">
              <div className="flex items-center gap-3 p-3 rounded border border-[var(--border)] hover:bg-[var(--muted)] hover:border-[var(--primary)] transition-all">
                <div className="text-xl">✨</div>
                <div>
                  <p className="font-medium text-[var(--foreground)] text-sm">
                    创建任务
                  </p>
                  <p className="text-xs text-[var(--foreground)] opacity-40">
                    开始新的数据分析任务
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/reports" className="block">
              <div className="flex items-center gap-3 p-3 rounded border border-[var(--border)] hover:bg-[var(--muted)] hover:border-[var(--primary)] transition-all">
                <div className="text-xl">📊</div>
                <div>
                  <p className="font-medium text-[var(--foreground)] text-sm">
                    查看报告
                  </p>
                  <p className="text-xs text-[var(--foreground)] opacity-40">
                    下载分析报告
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/report-generator" className="block">
              <div className="flex items-center gap-3 p-3 rounded border border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/10 to-[var(--secondary)]/10 hover:border-[var(--primary)] transition-all">
                <div className="text-xl">🪄</div>
                <div>
                  <p className="font-medium text-[var(--foreground)] text-sm">
                    智能报告
                  </p>
                  <p className="text-xs text-[var(--foreground)] opacity-40">
                    AI帮你生成报告
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/article-processor" className="block">
              <div className="flex items-center gap-3 p-3 rounded border border-[var(--border)] bg-gradient-to-r from-[var(--secondary)]/10 to-[var(--accent)]/10 hover:border-[var(--primary)] transition-all">
                <div className="text-xl">📝</div>
                <div>
                  <p className="font-medium text-[var(--foreground)] text-sm">
                    文章处理
                  </p>
                  <p className="text-xs text-[var(--foreground)] opacity-40">
                    AI提取和处理文章
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
