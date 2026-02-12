import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'

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
    
    const file = await prisma.file.findFirst({
      where: { id, userId: user.id },
    })
    
    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }
    
    // 检查是否有关联的任务
    const taskCount = await prisma.analysisTask.count({
      where: { fileId: id },
    })
    
    if (taskCount > 0) {
      return NextResponse.json(
        { error: '该文件有关联的分析任务，请先删除相关任务' },
        { status: 400 }
      )
    }
    
    // 删除物理文件
    try {
      await unlink(file.path)
    } catch (e) {
      console.error('删除物理文件失败:', e)
    }
    
    // 删除数据库记录
    await prisma.file.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除文件失败:', error)
    return NextResponse.json({ error: '删除文件失败' }, { status: 500 })
  }
}

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
    
    const file = await prisma.file.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
        tasks: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    })
    
    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }
    
    return NextResponse.json({ file })
  } catch (error) {
    console.error('获取文件详情失败:', error)
    return NextResponse.json({ error: '获取文件详情失败' }, { status: 500 })
  }
}
