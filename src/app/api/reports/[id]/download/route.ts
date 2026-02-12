import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    
    const { id } = await params
    
    const report = await prisma.report.findFirst({
      where: { id, userId: user.id },
      include: {
        task: {
          select: {
            name: true,
          },
        },
      },
    })
    
    if (!report) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 })
    }
    
    // 根据报告类型生成下载内容
    let content: string
    let contentType: string
    let filename: string
    
    switch (report.fileType) {
      case 'json':
        content = report.content || '{}'
        contentType = 'application/json'
        filename = `${report.name}.json`
        break
      case 'csv':
        content = generateCSVFromContent(report.content)
        contentType = 'text/csv'
        filename = `${report.name}.csv`
        break
      default:
        content = report.content || ''
        contentType = 'text/plain'
        filename = `${report.name}.txt`
    }
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('下载报告失败:', error)
    return NextResponse.json({ error: '下载报告失败' }, { status: 500 })
  }
}

function generateCSVFromContent(content: string | null): string {
  if (!content) return ''
  
  try {
    const data = JSON.parse(content)
    const lines: string[] = []
    
    // 简单的JSON转CSV
    if (data.insights && Array.isArray(data.insights)) {
      lines.push('指标,值')
      lines.push(`总行数,${data.totalRows || 0}`)
      lines.push(`列数,${data.columns || 0}`)
      lines.push('')
      lines.push('分析洞察')
      data.insights.forEach((insight: string, index: number) => {
        lines.push(`${index + 1},${insight}`)
      })
    }
    
    return lines.join('\n')
  } catch {
    return content
  }
}
