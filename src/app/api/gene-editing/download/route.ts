import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get('path');
    
    if (!path) {
      return NextResponse.json({ error: '缺少文件路径' }, { status: 400 });
    }

    // 转发到Python服务
    const response = await fetch(
      `${PYTHON_SERVICE_URL}/download?path=${encodeURIComponent(path)}`,
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `下载失败: ${response.statusText}` },
        { status: response.status }
      );
    }

    // 获取文件内容
    const blob = await response.blob();
    const headers = new Headers();
    
    // 复制响应头
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');
    
    if (contentType) headers.set('Content-Type', contentType);
    if (contentDisposition) headers.set('Content-Disposition', contentDisposition);

    return new NextResponse(blob, { headers });
  } catch (error) {
    console.error('下载代理失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '下载失败' },
      { status: 500 }
    );
  }
}
