import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { userId } = await params

    // 只能查看自己的报告列表
    if (currentUser.id !== userId) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    // 转发请求到Python服务
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/report/list/${userId}`, {
      method: 'GET',
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || '获取报告列表失败' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('获取报告列表API错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
