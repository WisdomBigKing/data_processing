import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Python分析服务回调接口
 * 
 * Python服务完成分析后，通过此接口回传结果
 * 
 * 请求体格式:
 * {
 *   status: 'processing' | 'completed' | 'failed',
 *   progress?: number,           // 0-100
 *   result?: {                   // 分析结果（status为completed时）
 *     summary: string,
 *     totalRows: number,
 *     columns: number,
 *     insights: string[],
 *     statistics?: object,
 *     charts?: array,
 *     recommendations?: string[]
 *   },
 *   error?: string,              // 错误信息（status为failed时）
 *   reportName?: string,         // 报告名称
 *   reportType?: string          // 报告类型: json, csv, pdf
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    
    // 验证API密钥（可选，增加安全性）
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.PYTHON_CALLBACK_API_KEY
    
    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json({ error: '无效的API密钥' }, { status: 401 })
    }
    
    const body = await request.json()
    const { status, progress, result, error, reportName, reportType } = body
    
    // 验证任务是否存在
    const task = await prisma.analysisTask.findUnique({
      where: { id: taskId },
    })
    
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }
    
    // 根据状态更新任务
    if (status === 'processing') {
      await prisma.analysisTask.update({
        where: { id: taskId },
        data: {
          status: 'processing',
          progress: progress || 0,
        },
      })
    } else if (status === 'completed') {
      // 创建报告
      if (result) {
        await prisma.report.create({
          data: {
            name: reportName || `${task.name} - 分析报告`,
            description: result.summary || '数据分析报告',
            content: JSON.stringify(result),
            fileType: reportType || 'json',
            taskId: task.id,
            userId: task.userId,
          },
        })
      }
      
      // 更新任务状态为完成
      await prisma.analysisTask.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
        },
      })
    } else if (status === 'failed') {
      await prisma.analysisTask.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          errorMessage: error || '分析失败',
        },
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('处理回调失败:', error)
    return NextResponse.json({ error: '处理回调失败' }, { status: 500 })
  }
}

/**
 * 进度更新接口（可选，用于频繁的进度更新）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const { progress } = await request.json()
    
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return NextResponse.json({ error: '无效的进度值' }, { status: 400 })
    }
    
    await prisma.analysisTask.update({
      where: { id: taskId },
      data: { progress },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新进度失败:', error)
    return NextResponse.json({ error: '更新进度失败' }, { status: 500 })
  }
}
