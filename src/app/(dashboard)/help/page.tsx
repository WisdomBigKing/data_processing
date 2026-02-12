"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function HelpPage() {
  const faqs = [
    {
      question: "支持哪些文件格式？",
      answer:
        "目前支持 CSV、Excel（.xlsx、.xls）、JSON、TXT 和 PDF 格式的文件。",
    },
    {
      question: "文件大小有限制吗？",
      answer: "单个文件最大支持 50MB。如果您的文件较大，建议分割后上传。",
    },
    {
      question: "分析需要多长时间？",
      answer:
        "分析时间取决于文件大小和数据复杂度，通常在几秒到几分钟之间。您可以在任务列表中查看实时进度。",
    },
    {
      question: "报告可以下载哪些格式？",
      answer:
        "目前支持 JSON 格式的报告下载，后续将支持 PDF、Excel 等更多格式。",
    },
    {
      question: "数据安全吗？",
      answer:
        "我们非常重视数据安全。所有上传的文件都经过加密存储，且仅供您个人访问。",
    },
    {
      question: "如何删除我的数据？",
      answer:
        "您可以在文件管理或任务管理页面删除相关数据。删除后数据将被永久移除。",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          帮助中心
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">了解如何使用</p>
      </div>

      {/* 快速开始 */}
      <Card>
        <CardHeader>
          <CardTitle>快速开始</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  上传数据文件
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  进入"文件管理"页面，点击上传区域或拖拽文件进行上传。支持
                  CSV、Excel、JSON 等格式。
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  创建分析任务
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  进入"分析任务"页面，点击"创建任务"按钮，选择要分析的文件并填写任务名称。
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  等待分析完成
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  系统会自动进行数据分析，您可以在任务详情页查看实时进度。
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  下载分析报告
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  分析完成后，您可以在任务详情页或"报告中心"下载生成的分析报告。
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 常见问题 */}
      <Card>
        <CardHeader>
          <CardTitle>常见问题</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.question}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 联系我们 */}
      <Card>
        <CardHeader>
          <CardTitle>需要更多帮助？</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            如果您有任何问题或建议，欢迎通过以下方式联系我们：
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-sm text-gray-500">邮箱</p>
                <p className="font-medium">support@example.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <div>
                <p className="text-sm text-gray-500">在线客服</p>
                <p className="font-medium">工作日 9:00-18:00</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
