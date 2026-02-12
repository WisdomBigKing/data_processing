'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Progress } from '@/components/ui/progress'
import { formatDate, getStatusText, getStatusColor, formatFileSize } from '@/lib/utils'

interface FileItem {
  id: string
  originalName: string
  size: number
}

interface Task {
  id: string
  name: string
  description: string | null
  status: string
  progress: number
  createdAt: string
  completedAt: string | null
  file: {
    id: string
    originalName: string
    size: number
  }
  reports: {
    id: string
    name: string
    fileType: string
    createdAt: string
  }[]
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    fileId: '',
  })

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, filesRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/files'),
      ])
      
      const tasksData = await tasksRes.json()
      const filesData = await filesRes.json()
      
      setTasks(tasksData.tasks || [])
      setFiles(filesData.files || [])
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    
    // 轮询更新任务状态
    const interval = setInterval(() => {
      fetchData()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [fetchData])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTask.name || !newTask.fileId) {
      setMessage({ type: 'error', text: '请填写任务名称并选择文件' })
      return
    }
    
    setIsCreating(true)
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || '创建任务失败')
      }
      
      setMessage({ type: 'success', text: '任务创建成功，正在处理中...' })
      setIsModalOpen(false)
      setNewTask({ name: '', description: '', fileId: '' })
      fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '创建任务失败' })
    } finally {
      setIsCreating(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return
    
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      
      if (!res.ok) {
        throw new Error('删除失败')
      }
      
      setMessage({ type: 'success', text: '任务已删除' })
      fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: '删除任务失败' })
    } finally {
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">分析任务</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            创建和管理数据分析任务
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          创建任务
        </Button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-4 text-gray-500">暂无任务</p>
              <p className="text-sm text-gray-400">创建您的第一个数据分析任务</p>
              <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                创建任务
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors dark:border-gray-700 dark:hover:border-blue-600"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {task.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {task.file.originalName}
                        </span>
                        <span>{formatDate(task.createdAt)}</span>
                      </div>
                      
                      {(task.status === 'processing' || task.status === 'pending') && (
                        <div className="mt-3">
                          <Progress value={task.progress} showLabel />
                        </div>
                      )}
                      
                      {task.reports.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-sm text-gray-500">报告:</span>
                          {task.reports.map((report) => (
                            <a
                              key={report.id}
                              href={`/api/reports/${report.id}/download`}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              {report.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link href={`/tasks/${task.id}`}>
                        <Button variant="outline" size="sm">
                          详情
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建任务弹窗 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="创建分析任务"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            id="taskName"
            label="任务名称"
            placeholder="请输入任务名称"
            value={newTask.name}
            onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              选择文件
            </label>
            <select
              value={newTask.fileId}
              onChange={(e) => setNewTask({ ...newTask, fileId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">请选择文件</option>
              {files.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.originalName} ({formatFileSize(file.size)})
                </option>
              ))}
            </select>
            {files.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">
                暂无文件，请先<Link href="/files" className="text-blue-600 hover:underline">上传文件</Link>
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              任务描述（可选）
            </label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              rows={3}
              placeholder="请输入任务描述"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button type="submit" isLoading={isCreating}>
              创建任务
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
