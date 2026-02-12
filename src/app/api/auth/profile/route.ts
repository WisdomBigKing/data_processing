import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    
    const { name } = await request.json()
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name },
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
      },
    })
    
    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('更新个人信息失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
