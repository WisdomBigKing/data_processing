import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    
    // 获取统计数据
    const [
      totalFiles,
      totalTasks,
      completedTasks,
      processingTasks,
      pendingTasks,
      failedTasks,
      totalReports,
      recentTasks,
      storageUsed,
    ] = await Promise.all([
      prisma.file.count({ where: { userId: user.id } }),
      prisma.analysisTask.count({ where: { userId: user.id } }),
      prisma.analysisTask.count({ where: { userId: user.id, status: 'completed' } }),
      prisma.analysisTask.count({ where: { userId: user.id, status: 'processing' } }),
      prisma.analysisTask.count({ where: { userId: user.id, status: 'pending' } }),
      prisma.analysisTask.count({ where: { userId: user.id, status: 'failed' } }),
      prisma.report.count({ where: { userId: user.id } }),
      prisma.analysisTask.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          file: {
            select: {
              originalName: true,
            },
          },
        },
      }),
      prisma.file.aggregate({
        where: { userId: user.id },
        _sum: { size: true },
      }),
    ])
    
    // 获取最近7天的任务统计
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const dailyTasks = await prisma.analysisTask.groupBy({
      by: ['status'],
      where: {
        userId: user.id,
        createdAt: { gte: sevenDaysAgo },
      },
      _count: true,
    })
    
    return NextResponse.json({
      stats: {
        totalFiles,
        totalTasks,
        completedTasks,
        processingTasks,
        pendingTasks,
        failedTasks,
        totalReports,
        storageUsed: storageUsed._sum.size || 0,
        successRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      recentTasks,
      dailyTasks,
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 })
  }
}
