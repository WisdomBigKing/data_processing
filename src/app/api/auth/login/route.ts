import { NextRequest, NextResponse } from 'next/server'
import { loginUser } from '@/lib/auth'
import { cookies } from 'next/headers'
import { parsePermissions, SUPER_ADMIN_NAME } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json()
    
    if (!name || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      )
    }
    
    const { user, token } = await loginUser(name, password)
    
    const cookieStore = await cookies()
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })
    
    // 解析权限，超管自动拥有所有权限
    const permissions = parsePermissions(user.permissions)
    const role = user.name === SUPER_ADMIN_NAME ? 'superadmin' : (user.role || 'user')
    
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: role,
        permissions: permissions,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
