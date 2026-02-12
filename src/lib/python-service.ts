/**
 * Python数据分析服务接口
 * 
 * 此模块提供与Python后端服务通信的接口
 * Python服务需要实现以下API：
 * 
 * 1. POST /api/analyze - 提交分析任务
 *    请求体: { taskId, filePath, fileName, analysisType, callbackUrl }
 *    响应: { success: true, message: string }
 * 
 * 2. GET /api/task/{taskId}/status - 查询任务状态
 *    响应: { status, progress, result?, error? }
 * 
 * 3. POST /api/task/{taskId}/cancel - 取消任务
 *    响应: { success: true }
 */

// Python服务配置
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
const PYTHON_SERVICE_TIMEOUT = parseInt(process.env.PYTHON_SERVICE_TIMEOUT || '30000')

export interface SubmitTaskParams {
  taskId: string
  filePath: string
  fileName: string
  analysisType: string
  callbackUrl: string
  options?: Record<string, unknown>
}

export interface TaskStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  result?: AnalysisResult
  error?: string
}

export interface AnalysisResult {
  summary: string
  totalRows: number
  columns: number
  insights: string[]
  charts?: ChartData[]
  statistics?: Record<string, unknown>
  recommendations?: string[]
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap'
  title: string
  data: unknown
}

/**
 * 提交任务到Python分析服务
 */
export async function submitTaskToPython(params: SubmitTaskParams): Promise<{ success: boolean; message: string }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PYTHON_SERVICE_TIMEOUT)

  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_id: params.taskId,
        file_path: params.filePath,
        file_name: params.fileName,
        analysis_type: params.analysisType,
        callback_url: params.callbackUrl,
        options: params.options || {},
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Python服务请求超时')
    }
    throw error
  }
}

/**
 * 查询Python服务中的任务状态
 */
export async function getTaskStatusFromPython(taskId: string): Promise<TaskStatusResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PYTHON_SERVICE_TIMEOUT)

  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/task/${taskId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Python服务请求超时')
    }
    throw error
  }
}

/**
 * 取消Python服务中的任务
 */
export async function cancelTaskInPython(taskId: string): Promise<{ success: boolean }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PYTHON_SERVICE_TIMEOUT)

  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/task/${taskId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Python服务请求超时')
    }
    throw error
  }
}

/**
 * 检查Python服务是否可用
 */
export async function checkPythonServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}
