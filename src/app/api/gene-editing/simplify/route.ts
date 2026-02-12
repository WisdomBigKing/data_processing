import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[gene-editing/simplify] 收到请求:', JSON.stringify(body));
    
    // 验证请求参数
    if (!body.file_path) {
      console.error('[gene-editing/simplify] 缺少file_path参数');
      return NextResponse.json(
        { error: '缺少file_path参数' },
        { status: 400 }
      );
    }
    
    console.log('[gene-editing/simplify] 转发到Python服务:', `${PYTHON_SERVICE_URL}/api/gene-editing/simplify`);
    
    // 转发到Python服务（确保UTF-8编码）
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/gene-editing/simplify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });

    console.log('[gene-editing/simplify] Python服务响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[gene-editing/simplify] Python服务错误:', errorText);
      return NextResponse.json(
        { error: `Python服务错误: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[gene-editing/simplify] 处理成功, 结果条数:', data.total_entries || 0);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[gene-editing/simplify] 代理请求失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '代理请求失败' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
