// 角色类型
export type UserRole = "superadmin" | "admin" | "user";

// 模块权限定义
export const MODULE_PERMISSIONS = {
  dashboard: {
    key: "dashboard",
    name: "仪表盘",
    description: "查看系统概览和统计",
  },
  files: { key: "files", name: "文件管理", description: "上传和管理文件" },
  tasks: { key: "tasks", name: "分析任务", description: "创建和管理分析任务" },
  excel: { key: "excel", name: "Excel处理", description: "处理Excel文件" },
  reportGenerator: {
    key: "reportGenerator",
    name: "智能报告",
    description: "生成智能报告",
  },
  reports: { key: "reports", name: "报告中心", description: "查看和下载报告" },
  imageEditor: {
    key: "imageEditor",
    name: "图像编辑器",
    description: "编辑图像",
  },
  dataAnalysis: {
    key: "dataAnalysis",
    name: "数据分析",
    description: "数据分析工具",
  },
  geneEditing: {
    key: "geneEditing",
    name: "基因编辑化简",
    description: "基因编辑工具",
  },
  mutationHighlight: {
    key: "mutationHighlight",
    name: "突变高亮标记",
    description: "突变高亮标记工具",
  },
  sequenceSorting: {
    key: "sequenceSorting",
    name: "序列排序",
    description: "按序号对基因序列数据排序",
  },
  settings: { key: "settings", name: "账户设置", description: "管理个人账户" },
  userManagement: {
    key: "userManagement",
    name: "用户管理",
    description: "管理系统用户",
  },
} as const;

export type ModulePermission = keyof typeof MODULE_PERMISSIONS;

// 超级管理员用户名
export const SUPER_ADMIN_NAME = "卢金旭";

// 角色显示名称
export const ROLE_NAMES: Record<UserRole, string> = {
  superadmin: "超级管理员",
  admin: "管理员",
  user: "普通用户",
};

// 角色权限层级
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  superadmin: 3,
  admin: 2,
  user: 1,
};

// 检查用户是否有某个模块的权限
export function hasPermission(
  userRole: UserRole,
  userPermissions: ModulePermission[],
  module: ModulePermission,
): boolean {
  // 超级管理员拥有所有权限
  if (userRole === "superadmin") return true;

  // 管理员拥有除用户管理外的所有权限（用户管理需要超管或管理员角色）
  if (userRole === "admin") {
    if (module === "userManagement") return true; // 管理员可以访问用户管理
    return true;
  }

  // 普通用户只能访问被分配的模块权限
  // 仪表盘和账户设置是默认权限
  if (module === "dashboard" || module === "settings") return true;

  return userPermissions.includes(module);
}

// 检查是否可以管理目标用户
export function canManageUser(
  operatorRole: UserRole,
  targetRole: UserRole,
): boolean {
  // 超级管理员可以管理任何人
  if (operatorRole === "superadmin") return true;

  // 管理员只能管理普通用户
  if (operatorRole === "admin" && targetRole === "user") return true;

  return false;
}

// 检查是否可以分配某个角色
export function canAssignRole(
  operatorRole: UserRole,
  targetRole: UserRole,
): boolean {
  // 超级管理员可以分配任何角色（包括管理员）
  if (operatorRole === "superadmin") return true;

  // 管理员只能将用户设为普通用户（不能创建管理员）
  if (operatorRole === "admin" && targetRole === "user") return true;

  return false;
}

// 检查是否可以查看用户密码（仅超管可以）
export function canViewPassword(operatorRole: UserRole): boolean {
  return operatorRole === "superadmin";
}

// 检查是否可以修改用户密码
export function canModifyPassword(
  operatorRole: UserRole,
  targetRole: UserRole,
  isSelf: boolean,
): boolean {
  // 用户可以修改自己的密码
  if (isSelf) return true;

  // 超级管理员可以修改任何人的密码
  if (operatorRole === "superadmin") return true;

  // 管理员只能修改普通用户的密码
  if (operatorRole === "admin" && targetRole === "user") return true;

  return false;
}

// 检查是否可以删除用户
export function canDeleteUser(
  operatorRole: UserRole,
  targetRole: UserRole,
  isSelf: boolean,
): boolean {
  // 不能删除自己
  if (isSelf) return false;

  // 超级管理员可以删除任何人
  if (operatorRole === "superadmin") return true;

  // 管理员只能删除普通用户
  if (operatorRole === "admin" && targetRole === "user") return true;

  return false;
}

// 解析权限字符串为数组
export function parsePermissions(
  permissionsStr: string | null | undefined,
): ModulePermission[] {
  if (!permissionsStr) return [];
  try {
    const parsed = JSON.parse(permissionsStr);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (p) => p in MODULE_PERMISSIONS,
      ) as ModulePermission[];
    }
    return [];
  } catch {
    return [];
  }
}

// 将权限数组转为字符串
export function stringifyPermissions(permissions: ModulePermission[]): string {
  return JSON.stringify(permissions);
}

// 获取默认权限（新用户）
export function getDefaultPermissions(): ModulePermission[] {
  return ["dashboard", "settings"];
}

// 获取所有模块权限列表
export function getAllModulePermissions(): Array<{
  key: ModulePermission;
  name: string;
  description: string;
}> {
  return Object.values(MODULE_PERMISSIONS);
}

// 模块路径与权限的映射
export const PATH_PERMISSION_MAP: Record<string, ModulePermission> = {
  "/dashboard": "dashboard",
  "/files": "files",
  "/tasks": "tasks",
  "/excel-processor": "excel",
  "/report-generator": "reportGenerator",
  "/reports": "reports",
  "/image-editor": "imageEditor",
  "/data-analysis": "dataAnalysis",
  "/gene-editing": "geneEditing",
  "/mutation-highlight": "mutationHighlight",
  "/sequence-sorting": "sequenceSorting",
  "/settings": "settings",
  "/users": "userManagement",
};

// 根据路径检查权限
export function hasPathPermission(
  pathname: string,
  userRole: UserRole,
  userPermissions: ModulePermission[],
): boolean {
  // 找到匹配的路径
  const matchedPath = Object.keys(PATH_PERMISSION_MAP).find(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );

  if (!matchedPath) return true; // 未知路径默认允许

  const requiredPermission = PATH_PERMISSION_MAP[matchedPath];
  return hasPermission(userRole, userPermissions, requiredPermission);
}
