import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { taskId } = await params

    // 转发请求到Python服务
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/report/download/${taskId}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const data = await response.json()
      return NextResponse.json(
        { error: data.detail || '下载报告失败' },
        { status: response.status }
      )
    }

    // 获取文件内容和头信息
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentDisposition = response.headers.get('content-disposition') || ''
    
    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    })
  } catch (error) {
    console.error('下载报告API错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
