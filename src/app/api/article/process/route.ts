import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { article, requirement } = body;

    if (!article || !article.trim()) {
      return NextResponse.json({ error: "请提供文章内容" }, { status: 400 });
    }

    if (!requirement || !requirement.trim()) {
      return NextResponse.json({ error: "请提供处理要求" }, { status: 400 });
    }

    // 调用Python服务进行文章处理
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/article/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ article, requirement }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "处理失败" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("文章处理API错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
