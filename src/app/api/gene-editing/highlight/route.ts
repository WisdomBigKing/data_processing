import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, parsePermissions, SUPER_ADMIN_NAME, UserRole } from '@/lib/permissions';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// 获取用户的实际角色
function getUserRole(user: { name: string | null; role: string }): UserRole {
  if (user.name === SUPER_ADMIN_NAME) return 'superadmin';
  if (user.role === 'admin') return 'admin';
  return 'user';
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    
    // 验证权限
    const userRole = getUserRole(user);
    const userPermissions = parsePermissions(user.permissions);
    if (!hasPermission(userRole, userPermissions, 'mutationHighlight')) {
      return NextResponse.json({ error: '无权限访问此功能' }, { status: 403 });
    }
    
    const body = await request.json();
    
    console.log('[gene-editing/highlight] 收到请求:', JSON.stringify(body));
    console.log('[gene-editing/highlight] target_sequence:', body.target_sequence);
    console.log('[gene-editing/highlight] original_filename:', body.original_filename);
    
    // 验证请求参数
    if (!body.file_path) {
      console.error('[gene-editing/highlight] 缺少file_path参数');
      return NextResponse.json(
        { error: '缺少file_path参数' },
        { status: 400 }
      );
    }
    
    console.log('[gene-editing/highlight] 转发到Python服务');
    
    // 转发到Python服务（确保UTF-8编码）
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/gene-editing/highlight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });

    console.log('[gene-editing/highlight] Python服务响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[gene-editing/highlight] Python服务错误:', errorText);
      return NextResponse.json(
        { error: `Python服务错误: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[gene-editing/highlight] 处理成功, 高亮行数:', data.total_highlighted || 0);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[gene-editing/highlight] 代理请求失败:', error);
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
