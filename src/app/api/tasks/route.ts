import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { submitTaskToPython } from '@/lib/python-service'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    
    const tasks = await prisma.analysisTask.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        file: {
          select: {
            id: true,
            originalName: true,
            size: true,
          },
        },
        reports: {
          select: {
            id: true,
            name: true,
            fileType: true,
            createdAt: true,
          },
        },
      },
    })
    
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('获取任务列表失败:', error)
    return NextResponse.json({ error: '获取任务列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    
    const { name, description, fileId, analysisType } = await request.json()
    
    if (!name || !fileId) {
      return NextResponse.json({ error: '任务名称和文件不能为空' }, { status: 400 })
    }
    
    // 验证文件是否存在且属于当前用户
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId: user.id },
    })
    
    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }
    
    // 创建任务记录
    const task = await prisma.analysisTask.create({
      data: {
        name,
        description,
        fileId,
        userId: user.id,
        status: 'pending',
      },
      include: {
        file: {
          select: {
            id: true,
            originalName: true,
            path: true,
          },
        },
      },
    })
    
    // 调用Python分析服务（异步，不等待结果）
    submitTaskToPython({
      taskId: task.id,
      filePath: file.path,
      fileName: file.originalName,
      analysisType: analysisType || 'default',
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tasks/${task.id}/callback`,
    }).catch(error => {
      console.error('提交Python任务失败:', error)
      // 更新任务状态为失败
      prisma.analysisTask.update({
        where: { id: task.id },
        data: { status: 'failed', errorMessage: 'Python服务连接失败' },
      }).catch(console.error)
    })
    
    return NextResponse.json({ task })
  } catch (error) {
    console.error('创建任务失败:', error)
    return NextResponse.json({ error: '创建任务失败' }, { status: 500 })
  }
}
