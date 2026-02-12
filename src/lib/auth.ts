import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { cookies } from 'next/headers'

const SESSION_EXPIRY_DAYS = 7

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createSession(userId: string): Promise<string> {
  const token = uuidv4()
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
  
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })
  
  return token
}

export async function validateSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })
  
  if (!session) return null
  
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } })
    return null
  }
  
  return session.user
}

export async function deleteSession(token: string) {
  await prisma.session.delete({ where: { token } }).catch(() => {})
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value
  
  if (!token) return null
  
  return validateSession(token)
}

export async function registerUser(name: string, password: string) {
  // 检查用户名是否已被使用
  const existingUser = await prisma.user.findUnique({ where: { name } })
  
  if (existingUser) {
    throw new Error('该用户名已被使用')
  }
  
  const hashedPassword = await hashPassword(password)
  
  const user = await prisma.user.create({
    data: {
      name,
      password: hashedPassword,
    },
  })
  
  return user
}

export async function loginUser(name: string, password: string) {
  const user = await prisma.user.findUnique({ where: { name } })
  
  if (!user) {
    throw new Error('用户不存在')
  }
  
  const isValid = await verifyPassword(password, user.password)
  
  if (!isValid) {
    throw new Error('密码错误')
  }
  
  const token = await createSession(user.id)
  
  return { user, token }
}
