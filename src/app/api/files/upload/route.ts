import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/json",
  "text/plain",
  "application/pdf",
];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件大小不能超过50MB" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "不支持的文件类型，请上传CSV、Excel、JSON、TXT或PDF文件" },
        { status: 400 },
      );
    }

    // 创建上传目录（如果 UPLOAD_DIR 是绝对路径则直接使用，否则相对于 cwd）
    const baseUploadDir = path.isAbsolute(UPLOAD_DIR)
      ? UPLOAD_DIR
      : path.join(process.cwd(), UPLOAD_DIR);
    const uploadPath = path.join(baseUploadDir, user.id);
    await mkdir(uploadPath, { recursive: true });

    // 生成唯一文件名
    const ext = path.extname(file.name);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadPath, filename);

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 验证Excel文件格式（.xlsx文件应以PK开头，即ZIP格式）
    if (file.name.endsWith(".xlsx")) {
      const header = buffer.slice(0, 4);
      const isZip =
        header[0] === 0x50 &&
        header[1] === 0x4b &&
        header[2] === 0x03 &&
        header[3] === 0x04;
      if (!isZip) {
        console.error("文件验证失败: 不是有效的xlsx文件格式", {
          filename: file.name,
          headerHex: header.toString("hex"),
          size: buffer.length,
        });
        return NextResponse.json(
          {
            error:
              "文件格式无效：上传的文件不是有效的Excel(.xlsx)格式，请检查文件是否损坏或选择正确的文件",
          },
          { status: 400 },
        );
      }
    }

    await writeFile(filePath, buffer);

    // 保存文件记录到数据库
    const fileRecord = await prisma.file.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        path: filePath,
        userId: user.id,
      },
    });

    return NextResponse.json({
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        size: fileRecord.size,
        path: fileRecord.path,
        createdAt: fileRecord.createdAt,
      },
    });
  } catch (error) {
    console.error("文件上传失败:", error);
    return NextResponse.json({ error: "文件上传失败" }, { status: 500 });
  }
}
