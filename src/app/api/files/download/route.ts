import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { readFile, stat } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    
    const body = await request.json();
    const { file_path } = body;
    
    if (!file_path) {
      return NextResponse.json({ error: '缺少文件路径' }, { status: 400 });
    }
    
    // 规范化路径
    const normalizedPath = path.normalize(file_path);
    
    // 安全检查：确保文件在允许的目录内
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const pythonReportsDir = path.join(process.cwd(), 'python_service', 'reports');
    
    const isInUploadsDir = normalizedPath.startsWith(uploadsDir);
    const isInReportsDir = normalizedPath.startsWith(pythonReportsDir);
    
    if (!isInUploadsDir && !isInReportsDir) {
      console.error('[files/download] 非法路径访问:', normalizedPath);
      return NextResponse.json({ error: '无权访问该文件' }, { status: 403 });
    }
    
    // 检查文件是否存在
    try {
      await stat(normalizedPath);
    } catch {
      console.error('[files/download] 文件不存在:', normalizedPath);
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }
    
    // 读取文件
    const fileBuffer = await readFile(normalizedPath);
    const filename = path.basename(normalizedPath);
    
    // 根据文件扩展名设置 Content-Type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.csv': 'text/csv',
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.json': 'application/json',
      '.txt': 'text/plain',
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // 对文件名进行 URL 编码以支持中文
    const encodedFilename = encodeURIComponent(filename);
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[files/download] 下载失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '下载失败' },
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
