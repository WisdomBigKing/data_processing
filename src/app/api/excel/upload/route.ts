import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const slopeB = searchParams.get('slope_b');
    const slopeE = searchParams.get('slope_e');
    
    // 构建目标URL
    let targetUrl = `${PYTHON_SERVICE_URL}/api/excel/upload`;
    if (slopeB && slopeE) {
      targetUrl = `${PYTHON_SERVICE_URL}/api/excel/process?slope_b=${slopeB}&slope_e=${slopeE}`;
    }
    
    // 转发请求到Python服务
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Excel upload error:', error);
    return NextResponse.json(
      { success: false, message: `服务请求失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}
