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
      icon: (
        <svg
          className="h-6 w-6 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      ),
      color: "bg-blue-100 dark:bg-blue-900/50",
    },
    {
      title: "任务总数",
      value: stats.totalTasks,
      icon: (
        <svg
          className="h-6 w-6 text-purple-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      color: "bg-purple-100 dark:bg-purple-900/50",
    },
    {
      title: "已完成",
      value: stats.completedTasks,
      icon: (
        <svg
          className="h-6 w-6 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-green-100 dark:bg-green-900/50",
    },
    {
      title: "进行中",
      value: stats.pendingTasks,
      icon: (
        <svg
          className="h-6 w-6 text-yellow-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-yellow-100 dark:bg-yellow-900/50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            欢迎回来，{user?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            这是您的数据分析工作台
          </p>
        </div>
        <Link href="/files">
          <Button>
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            上传新文件
          </Button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isLoading ? "-" : stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>最近任务</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="mt-2 text-gray-500">暂无任务</p>
                <Link href="/tasks">
                  <Button variant="outline" className="mt-4">
                    创建第一个任务
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {task.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {task.file.originalName}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}
                        >
                          {getStatusText(task.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(task.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                <Link href="/tasks" className="block text-center">
                  <Button variant="ghost" className="w-full">
                    查看全部任务
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/files" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">上传文件</p>
                  <p className="text-sm text-gray-500">上传数据文件进行分析</p>
                </div>
              </div>
            </Link>

            <Link href="/tasks" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors dark:border-gray-700 dark:hover:border-purple-600 dark:hover:bg-purple-900/20">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                  <svg
                    className="h-5 w-5 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">创建任务</p>
                  <p className="text-sm text-gray-500">开始新的数据分析任务</p>
                </div>
              </div>
            </Link>

            <Link href="/reports" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-colors dark:border-gray-700 dark:hover:border-green-600 dark:hover:bg-green-900/20">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">查看报告</p>
                  <p className="text-sm text-gray-500">下载分析报告</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
