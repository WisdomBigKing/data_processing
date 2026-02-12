'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface Report {
  id: string
  name: string
  description: string | null
  fileType: string
  createdAt: string
  task: {
    id: string
    name: string
    status: string
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      
      // 从所有任务中提取报告
      const allReports: Report[] = []
      for (const task of data.tasks || []) {
        for (const report of task.reports || []) {
          allReports.push({
            ...report,
            task: {
              id: task.id,
              name: task.name,
              status: task.status,
            },
          })
        }
      }
      
      // 按创建时间排序
      allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setReports(allReports)
    } catch (error) {
      console.error('获取报告列表失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'json':
        return (
          <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        )
      case 'csv':
        return (
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        )
      case 'pdf':
        return (
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      default:
        return (
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">报告中心</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          查看和下载所有分析报告
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>报告列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-500">暂无报告</p>
              <p className="text-sm text-gray-400">完成分析任务后将自动生成报告</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all dark:border-gray-700 dark:hover:border-blue-600"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      {getFileTypeIcon(report.fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate" title={report.name}>
                        {report.name}
                      </p>
                      {report.description && (
                        <p className="text-sm text-gray-500 truncate">{report.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        来自: {report.task.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <a href={`/api/reports/${report.id}/download`}>
                      <Button size="sm">
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        下载
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
