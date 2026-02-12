import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  SUPER_ADMIN_NAME, 
  parsePermissions, 
  stringifyPermissions,
  canManageUser,
  canDeleteUser,
  canModifyPassword,
  canViewPassword,
  canAssignRole,
  UserRole,
  ModulePermission
} from '@/lib/permissions'

// 获取用户的实际角色
function getUserRole(user: { name: string | null; role: string }): UserRole {
  if (user.name === SUPER_ADMIN_NAME) return 'superadmin'
  if (user.role === 'admin') return 'admin'
  return 'user'
}

// 获取用户列表（管理员和超管可访问）
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    
    const currentRole = getUserRole(currentUser)
    
    // 只有管理员和超管可以查看用户列表
    if (currentRole !== 'superadmin' && currentRole !== 'admin') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 })
    }
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        permissions: true,
        password: currentRole === 'superadmin', // 只有超管可以看到密码
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    
    // 处理返回的用户数据
    const processedUsers = users.map(user => ({
      ...user,
      role: getUserRole(user),
      permissions: parsePermissions(user.permissions),
      password: currentRole === 'superadmin' ? user.password : undefined,
    }))
    
    return NextResponse.json({ users: processedUsers, currentRole })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 })
  }
}

// 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    
    const currentRole = getUserRole(currentUser)
    const body = await request.json()
    const { userId, name, password, role, permissions } = body
    
    if (!userId) {
      return NextResponse.json({ error: '用户ID不能为空' }, { status: 400 })
    }
    
    // 获取目标用户
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }
    
    const targetRole = getUserRole(targetUser)
    const isSelf = currentUser.id === userId
    
    // 检查是否有权限管理该用户
    if (!isSelf && !canManageUser(currentRole, targetRole)) {
      return NextResponse.json({ error: '无权限修改该用户' }, { status: 403 })
    }
    
    // 构建更新数据
    const updateData: Record<string, unknown> = {}
    
    // 更新基本信息（自己或有权限的管理员可以修改）
    if (name !== undefined && (isSelf || canManageUser(currentRole, targetRole))) {
      // 不能修改超管的名字
      if (targetUser.name === SUPER_ADMIN_NAME) {
        return NextResponse.json({ error: '不能修改超级管理员的用户名' }, { status: 403 })
      }
      updateData.name = name
    }
    
    // 更新密码
    if (password !== undefined) {
      if (!canModifyPassword(currentRole, targetRole, isSelf)) {
        return NextResponse.json({ error: '无权限修改该用户密码' }, { status: 403 })
      }
      updateData.password = await hashPassword(password)
    }
    
    // 更新角色（只有超管可以设置管理员，管理员只能设置普通用户）
    if (role !== undefined && !isSelf) {
      if (!canAssignRole(currentRole, role as UserRole)) {
        return NextResponse.json({ error: '无权限分配该角色' }, { status: 403 })
      }
      // 不能修改超管的角色
      if (targetUser.name === SUPER_ADMIN_NAME) {
        return NextResponse.json({ error: '不能修改超级管理员的角色' }, { status: 403 })
      }
      updateData.role = role
    }
    
    // 更新权限（超管和管理员可以分配权限）
    if (permissions !== undefined && !isSelf) {
      if (!canManageUser(currentRole, targetRole)) {
        return NextResponse.json({ error: '无权限修改该用户权限' }, { status: 403 })
      }
      updateData.permissions = stringifyPermissions(permissions as ModulePermission[])
    }
    
    // 执行更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    })
    
    return NextResponse.json({ 
      user: {
        ...updatedUser,
        role: getUserRole(updatedUser),
        permissions: parsePermissions(updatedUser.permissions),
      }
    })
  } catch (error) {
    console.error('更新用户失败:', error)
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 })
  }
}

// 删除用户
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    
    const currentRole = getUserRole(currentUser)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: '用户ID不能为空' }, { status: 400 })
    }
    
    // 获取目标用户
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }
    
    const targetRole = getUserRole(targetUser)
    const isSelf = currentUser.id === userId
    
    // 检查是否有权限删除该用户
    if (!canDeleteUser(currentRole, targetRole, isSelf)) {
      return NextResponse.json({ error: '无权限删除该用户' }, { status: 403 })
    }
    
    // 不能删除超级管理员
    if (targetUser.name === SUPER_ADMIN_NAME) {
      return NextResponse.json({ error: '不能删除超级管理员' }, { status: 403 })
    }
    
    // 执行删除
    await prisma.user.delete({ where: { id: userId } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除用户失败:', error)
    return NextResponse.json({ error: '删除用户失败' }, { status: 500 })
  }
}
