import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    
    const { id } = await params
    
    const task = await prisma.analysisTask.findFirst({
      where: { id, userId: user.id },
      include: {
        file: {
          select: {
            id: true,
            originalName: true,
            size: true,
            mimeType: true,
          },
        },
        reports: {
          select: {
            id: true,
            name: true,
            description: true,
            content: true,
            fileType: true,
            createdAt: true,
          },
        },
      },
    })
    
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }
    
    return NextResponse.json({ task })
  } catch (error) {
    console.error('获取任务详情失败:', error)
    return NextResponse.json({ error: '获取任务详情失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    
    const { id } = await params
    
    const task = await prisma.analysisTask.findFirst({
      where: { id, userId: user.id },
    })
    
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }
    
    await prisma.analysisTask.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除任务失败:', error)
    return NextResponse.json({ error: '删除任务失败' }, { status: 500 })
  }
}
