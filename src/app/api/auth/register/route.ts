import { NextRequest, NextResponse } from 'next/server'
import { registerUser, createSession, getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { SUPER_ADMIN_NAME } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json()
    
    // 检查是否有用户存在
    const userCount = await prisma.user.count()
    
    // 如果已有用户，则需要验证当前登录用户是否为管理员
    if (userCount > 0) {
      const currentUser = await getCurrentUser()
      
      // 未登录用户不能注册
      if (!currentUser) {
        return NextResponse.json(
          { error: '注册功能已关闭，请联系管理员' },
          { status: 403 }
        )
      }
      
      // 只有超管或管理员可以注册新用户
      const isAdmin = currentUser.name === SUPER_ADMIN_NAME || currentUser.role === 'admin'
      if (!isAdmin) {
        return NextResponse.json(
          { error: '您没有权限注册新用户，请联系管理员' },
          { status: 403 }
        )
      }
    }
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: '用户名不能为空' },
        { status: 400 }
      )
    }
    
    if (!password) {
      return NextResponse.json(
        { error: '密码不能为空' },
        { status: 400 }
      )
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少6位' },
        { status: 400 }
      )
    }
    
    const user = await registerUser(name, password)
    
    // 如果是第一个用户（管理员自己注册），则创建会话
    // 如果是管理员为他人注册，则不创建会话
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      const token = await createSession(user.id)
      
      const cookieStore = await cookies()
      cookieStore.set('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      })
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      message: currentUser ? '用户创建成功' : '注册成功',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '注册失败'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
