import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ downloadId: string }> }
) {
  try {
    const { downloadId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const filename = searchParams.get('filename') || 'processed_result.xlsx';
    
    // 转发请求到Python服务
    const response = await fetch(
      `${PYTHON_SERVICE_URL}/api/excel/download/${downloadId}?filename=${encodeURIComponent(filename)}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: '文件不存在或已过期' },
        { status: 404 }
      );
    }
    
    // 获取文件内容
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    
    // 返回文件流
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
    
  } catch (error) {
    console.error('Excel download error:', error);
    return NextResponse.json(
      { success: false, message: `下载失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}
