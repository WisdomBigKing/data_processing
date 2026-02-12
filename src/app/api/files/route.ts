import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    
    const files = await prisma.file.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    })
    
    return NextResponse.json({ files })
  } catch (error) {
    console.error('获取文件列表失败:', error)
    return NextResponse.json({ error: '获取文件列表失败' }, { status: 500 })
  }
}
