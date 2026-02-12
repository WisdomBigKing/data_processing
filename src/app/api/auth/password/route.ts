import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, verifyPassword, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    
    const { currentPassword, newPassword } = await request.json()
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码长度至少6位' }, { status: 400 })
    }
    
    // 验证当前密码
    const isValid = await verifyPassword(currentPassword, user.password)
    
    if (!isValid) {
      return NextResponse.json({ error: '当前密码错误' }, { status: 400 })
    }
    
    // 更新密码
    const hashedPassword = await hashPassword(newPassword)
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('修改密码失败:', error)
    return NextResponse.json({ error: '修改密码失败' }, { status: 500 })
  }
}
