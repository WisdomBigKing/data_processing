'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

interface ReportTask {
  task_id: string
  status: string
  progress: number
  progress_message: string
  report_title: string
  output_format: string
  created_at: string
  output_path?: string
  error_message?: string
}

export default function ReportGeneratorPage() {
  const { user } = useAuthStore()
  const [files, setFiles] = useState<File[]>([])
  const [requirement, setRequirement] = useState('')
  const [taskDescription, setTaskDescription] = useState('')  // 新增：任务描述
  const [reportTitle, setReportTitle] = useState('数据分析报告')
  const [outputFormat, setOutputFormat] = useState<'word' | 'ppt'>('word')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTask, setCurrentTask] = useState<ReportTask | null>(null)
  const [tasks, setTasks] = useState<ReportTask[]>([])
  const [error, setError] = useState('')

  // 获取用户的报告任务列表
  const fetchTasks = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const res = await fetch(`/api/report/list/${user.id}`)
      const data = await res.json()
      if (data.success) {
        setTasks(data.tasks || [])
      }
    } catch (err) {
      console.error('获取任务列表失败:', err)
    }
  }, [user?.id])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // 轮询当前任务状态
  useEffect(() => {
    if (!currentTask || currentTask.status === 'completed' || currentTask.status === 'failed') {
      return
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/report/status/${currentTask.task_id}`)
        const data = await res.json()
        if (data.success) {
          setCurrentTask(data.task)
          if (data.task.status === 'completed' || data.task.status === 'failed') {
            fetchTasks()
          }
        }
      } catch (err) {
        console.error('获取任务状态失败:', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [currentTask, fetchTasks])

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const excelFiles = selectedFiles.filter(f => 
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    )
    setFiles(excelFiles)
  }

  // 提交报告生成请求
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (files.length === 0) {
      setError('请选择至少一个Excel文件')
      return
    }

    if (!requirement.trim()) {
      setError('请输入分析需求')
      return
    }

    setIsSubmitting(true)

    try {
      // 先上传文件
      const uploadedPaths: string[] = []
      
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        
        const uploadRes = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (!uploadRes.ok) {
          throw new Error(`上传文件失败: ${file.name}`)
        }
        
        const uploadData = await uploadRes.json()
        uploadedPaths.push(uploadData.file.path)
      }

      // 创建报告生成任务
      const res = await fetch('/api/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          excel_files: uploadedPaths,
          user_requirement: requirement,
          task_description: taskDescription,  // 新增：任务描述
          report_title: reportTitle,
          output_format: outputFormat,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '创建任务失败')
      }

      setCurrentTask(data.task)
      setFiles([])
      setRequirement('')
      setTaskDescription('')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 下载报告
  const handleDownload = async (taskId: string) => {
    window.open(`/api/report/download/${taskId}`, '_blank')
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '等待中'
      case 'parsing': return '解析中'
      case 'analyzing': return '分析中'
      case 'generating': return '生成中'
      case 'completed': return '已完成'
      case 'failed': return '失败'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">智能报告生成</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          上传Excel文件，输入分析需求，自动生成专业的数据分析报告
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：报告生成表单 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>创建分析报告</CardTitle>
              <CardDescription>
                上传需要分析的Excel文件，描述您的分析需求
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm dark:bg-red-900/50 dark:text-red-400">
                    {error}
                  </div>
                )}

                {/* 文件上传 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    上传Excel文件 *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="excel-upload"
                    />
                    <label htmlFor="excel-upload" className="cursor-pointer">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        点击或拖拽上传Excel文件
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        支持 .xlsx, .xls 格式，可多选
                      </p>
                    </label>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 任务描述 - 新增 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    当前任务/目标
                    <span className="text-gray-400 font-normal ml-2">（Agent将分析任务并提供问题总结和改善建议）</span>
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="请描述您当前面临的任务或目标，例如：&#10;- 本月目标：香爆脆铺货率达到90%，AC>60&#10;- 8月任务：完成3-5级商圈MA/校园渠道全覆盖&#10;- 经营目标：动销环比提升15%，TOP门店周转率>2次/月&#10;- 竞品攻坚：转化竞品TOP-500门店30%"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
                  />
                </div>

                {/* 分析需求 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    分析需求 *
                    <span className="text-gray-400 font-normal ml-2">（描述您希望从数据中获得的分析内容）</span>
                  </label>
                  <textarea
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    placeholder="请详细描述您的分析需求，例如：&#10;- 从任务达成、经营目标、打压+创新几个方面分析&#10;- 分析各区域的销售业绩排名和差距&#10;- 找出铺货率/陈列/动销的问题点&#10;- 提供具体的改善方法和行动计划"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
                  />
                </div>

                {/* 报告标题 */}
                <div>
                  <Input
                    id="report-title"
                    type="text"
                    label="报告标题"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="输入报告标题"
                  />
                </div>

                {/* 输出格式 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    输出格式
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value="word"
                        checked={outputFormat === 'word'}
                        onChange={() => setOutputFormat('word')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Word文档 (.docx)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value="ppt"
                        checked={outputFormat === 'ppt'}
                        onChange={() => setOutputFormat('ppt')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        PPT演示文稿 (.pptx)
                      </span>
                    </label>
                  </div>
                </div>

                {/* 提交按钮 */}
                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  {isSubmitting ? '正在处理...' : '生成报告'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 当前任务进度 */}
          {currentTask && currentTask.status !== 'completed' && currentTask.status !== 'failed' && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>生成进度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{currentTask.report_title}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(currentTask.status)}`}>
                      {getStatusText(currentTask.status)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${currentTask.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">{currentTask.progress_message}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧：历史报告列表 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>历史报告</CardTitle>
              <CardDescription>您生成的所有报告</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  暂无报告记录
                </p>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 10).map((task) => (
                    <div 
                      key={task.task_id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {task.report_title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(task.created_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ml-2 ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                      </div>
                      
                      {task.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() => handleDownload(task.task_id)}
                        >
                          下载 {task.output_format === 'ppt' ? 'PPT' : 'Word'}
                        </Button>
                      )}
                      
                      {task.status === 'failed' && task.error_message && (
                        <p className="text-xs text-red-500 mt-2">
                          {task.error_message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
