import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { parsePermissions, SUPER_ADMIN_NAME } from '@/lib/permissions'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    
    // 解析权限，超管自动拥有所有权限
    const permissions = parsePermissions(user.permissions)
    const role = user.name === SUPER_ADMIN_NAME ? 'superadmin' : (user.role || 'user')
    
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: role,
        permissions: permissions,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    })
  } catch {
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 })
  }
}
