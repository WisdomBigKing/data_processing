'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatDate, getStatusText, getStatusColor, formatFileSize } from '@/lib/utils'

interface TaskDetail {
  id: string
  name: string
  description: string | null
  status: string
  progress: number
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  file: {
    id: string
    originalName: string
    size: number
    mimeType: string
  }
  reports: {
    id: string
    name: string
    description: string | null
    content: string | null
    fileType: string
    createdAt: string
  }[]
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${params.id}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || '获取任务详情失败')
      }
      
      setTask(data.task)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务详情失败')
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchTask()
    
    // 如果任务正在处理中，轮询更新状态
    const interval = setInterval(() => {
      if (task?.status === 'processing' || task?.status === 'pending') {
        fetchTask()
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [fetchTask, task?.status])

  const handleDelete = async () => {
    if (!confirm('确定要删除这个任务吗？')) return
    
    try {
      const res = await fetch(`/api/tasks/${params.id}`, { method: 'DELETE' })
      
      if (!res.ok) {
        throw new Error('删除失败')
      }
      
      router.push('/tasks')
    } catch (err) {
      setError('删除任务失败')
    }
  }

  const parseReportContent = (content: string | null) => {
    if (!content) return null
    try {
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="mt-4 text-gray-500">{error || '任务不存在'}</p>
        <Link href="/tasks">
          <Button variant="outline" className="mt-4">返回任务列表</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tasks">
            <Button variant="ghost" size="sm">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{task.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              任务详情
            </p>
          </div>
        </div>
        <Button variant="danger" onClick={handleDelete}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          删除任务
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 任务状态 */}
          <Card>
            <CardHeader>
              <CardTitle>任务状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </span>
                {task.status === 'completed' && (
                  <span className="text-sm text-gray-500">
                    完成于 {formatDate(task.completedAt!)}
                  </span>
                )}
              </div>
              
              {(task.status === 'processing' || task.status === 'pending') && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>处理进度</span>
                    <span>{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} />
                </div>
              )}
              
              {task.status === 'failed' && task.errorMessage && (
                <div className="p-4 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                  <p className="font-medium">错误信息</p>
                  <p className="text-sm mt-1">{task.errorMessage}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 分析报告 */}
          {task.reports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>分析报告</CardTitle>
              </CardHeader>
              <CardContent>
                {task.reports.map((report) => {
                  const content = parseReportContent(report.content)
                  return (
                    <div key={report.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{report.name}</h4>
                          {report.description && (
                            <p className="text-sm text-gray-500">{report.description}</p>
                          )}
                        </div>
                        <a href={`/api/reports/${report.id}/download`}>
                          <Button size="sm">
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            下载报告
                          </Button>
                        </a>
                      </div>
                      
                      {content && (
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-white dark:bg-gray-700">
                              <p className="text-sm text-gray-500">总行数</p>
                              <p className="text-2xl font-bold">{content.totalRows?.toLocaleString() || '-'}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-white dark:bg-gray-700">
                              <p className="text-sm text-gray-500">列数</p>
                              <p className="text-2xl font-bold">{content.columns || '-'}</p>
                            </div>
                          </div>
                          
                          {content.insights && content.insights.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-2">分析洞察</h5>
                              <ul className="space-y-2">
                                {content.insights.map((insight: string, index: number) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm">{insight}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 侧边信息 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>任务信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.description && (
                <div>
                  <p className="text-sm text-gray-500">描述</p>
                  <p className="mt-1">{task.description}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500">创建时间</p>
                <p className="mt-1">{formatDate(task.createdAt)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">最后更新</p>
                <p className="mt-1">{formatDate(task.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>源文件</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" title={task.file.originalName}>
                    {task.file.originalName}
                  </p>
                  <p className="text-sm text-gray-500">{formatFileSize(task.file.size)}</p>
                  <p className="text-xs text-gray-400">{task.file.mimeType}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
