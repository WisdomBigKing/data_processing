import { NextResponse } from 'next/server';

// 获取处理历史
// 注意：当前为简化版本，返回空数组
// 后续可以扩展为从数据库获取历史记录
export async function GET() {
  // 暂时返回空数组，后续可以扩展
  return NextResponse.json({
    success: true,
    history: []
  });
}
