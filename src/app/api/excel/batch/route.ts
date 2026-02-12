import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: '请选择要处理的文件' },
        { status: 400 }
      );
    }

    // 获取参数
    const searchParams = request.nextUrl.searchParams;
    const slopeB = searchParams.get('slope_b') || '-0.4823';
    const slopeE = searchParams.get('slope_e') || '0.4557';

    // 并行处理所有文件
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const singleFormData = new FormData();
          singleFormData.append('file', file);

          const targetUrl = `${PYTHON_SERVICE_URL}/api/excel/process?slope_b=${slopeB}&slope_e=${slopeE}`;
          
          const response = await fetch(targetUrl, {
            method: 'POST',
            body: singleFormData,
          });

          const data = await response.json();
          return {
            filename: file.name,
            ...data
          };
        } catch (error) {
          return {
            filename: file.name,
            success: false,
            message: `处理失败: ${error instanceof Error ? error.message : '未知错误'}`
          };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      message: `批量处理完成: ${successCount} 成功, ${failCount} 失败`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount
      }
    });

  } catch (error) {
    console.error('Batch processing error:', error);
    return NextResponse.json(
      { success: false, message: `批量处理失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}
