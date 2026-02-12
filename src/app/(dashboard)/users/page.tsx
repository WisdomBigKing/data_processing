"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  ROLE_NAMES,
  MODULE_PERMISSIONS,
  UserRole,
  ModulePermission,
  canManageUser,
  canDeleteUser,
  canModifyPassword,
  canViewPassword,
  canAssignRole,
  SUPER_ADMIN_NAME,
  getAllModulePermissions,
} from "@/lib/permissions";

interface User {
  id: string;
  name: string;
  role: UserRole;
  permissions: ModulePermission[];
  password?: string;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>("user");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // 新用户表单
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 编辑用户
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("user");
  const [editPermissions, setEditPermissions] = useState<ModulePermission[]>(
    [],
  );
  const [editError, setEditError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // 检查权限 - 管理员和超管可以访问
  useEffect(() => {
    const userRole = user?.role as UserRole;
    if (user && userRole !== "superadmin" && userRole !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users || []);
        setCurrentRole(data.currentRole || "user");
      } else {
        setError(data.error || "获取用户列表失败");
      }
    } catch {
      setError("获取用户列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userRole = user?.role as UserRole;
    if (userRole === "superadmin" || userRole === "admin") {
      fetchUsers();
    }
  }, [user]);

  // 创建新用户
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!newName.trim()) {
      setFormError("用户名不能为空");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("两次输入的密码不一致");
      return;
    }

    if (newPassword.length < 6) {
      setFormError("密码长度至少6位");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "创建用户失败");
      }

      setFormSuccess(`用户 "${data.user.name}" 创建成功！`);
      setNewName("");
      setNewPassword("");
      setConfirmPassword("");

      fetchUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "创建用户失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 开始编辑用户
  const startEditUser = (targetUser: User) => {
    setEditingUser(targetUser);
    setEditName(targetUser.name);
    setEditPassword("");
    setEditRole(targetUser.role);
    setEditPermissions(targetUser.permissions || []);
    setEditError("");
  };

  // 保存用户编辑
  const handleSaveUser = async () => {
    if (!editingUser) return;
    setEditError("");
    setIsEditing(true);

    try {
      const updateData: Record<string, unknown> = {
        userId: editingUser.id,
      };

      // 只有当值改变时才更新
      if (editName !== editingUser.name) updateData.name = editName;
      if (editPassword) updateData.password = editPassword;
      if (editRole !== editingUser.role) updateData.role = editRole;

      // 检查权限是否变化
      const permChanged =
        JSON.stringify(editPermissions.sort()) !==
        JSON.stringify((editingUser.permissions || []).sort());
      if (permChanged) updateData.permissions = editPermissions;

      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "更新用户失败");
      }

      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "更新用户失败");
    } finally {
      setIsEditing(false);
    }
  };

  // 删除用户
  const handleDeleteUser = async (targetUser: User) => {
    if (!confirm(`确定要删除用户 "${targetUser.name}" 吗？此操作不可恢复。`))
      return;

    try {
      const res = await fetch(`/api/users?userId=${targetUser.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "删除用户失败");
      }

      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除用户失败");
    }
  };

  // 切换权限
  const togglePermission = (perm: ModulePermission) => {
    if (editPermissions.includes(perm)) {
      setEditPermissions(editPermissions.filter((p) => p !== perm));
    } else {
      setEditPermissions([...editPermissions, perm]);
    }
  };

  // 获取角色样式
  const getRoleStyle = (role: UserRole) => {
    switch (role) {
      case "superadmin":
        return "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400";
      case "admin":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // 权限检查
  const userRole = user?.role as UserRole;
  if (!user || (userRole !== "superadmin" && userRole !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">检查权限中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            用户管理
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            管理系统用户账户和权限
            <span
              className={`ml-2 text-xs px-2 py-0.5 rounded ${getRoleStyle(currentRole)}`}
            >
              当前身份: {ROLE_NAMES[currentRole]}
            </span>
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "取消" : "+ 创建用户"}
        </Button>
      </div>

      {/* 创建用户表单 */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>创建新用户</CardTitle>
            <CardDescription>为系统添加新的用户账户</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm dark:bg-red-900/50 dark:text-red-400">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm dark:bg-green-900/50 dark:text-green-400">
                  {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  id="newName"
                  type="text"
                  label="用户名"
                  placeholder="请输入用户名（唯一）"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />

                <Input
                  id="newPassword"
                  type="password"
                  label="密码"
                  placeholder="请输入密码（至少6位）"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <Input
                  id="confirmPassword"
                  type="password"
                  label="确认密码"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" isLoading={isSubmitting}>
                  创建用户
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 编辑用户对话框 */}
      {editingUser && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>编辑用户: {editingUser.name}</CardTitle>
            <CardDescription>修改用户信息和权限</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {editError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm dark:bg-red-900/50 dark:text-red-400">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="editName"
                  type="text"
                  label="用户名"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={editingUser.name === SUPER_ADMIN_NAME}
                />

                {canModifyPassword(
                  currentRole,
                  editingUser.role,
                  user?.id === editingUser.id,
                ) && (
                  <Input
                    id="editPassword"
                    type="password"
                    label="新密码（留空不修改）"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="留空保持原密码"
                  />
                )}

                {currentRole === "superadmin" &&
                  canViewPassword(currentRole) &&
                  editingUser.password && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        当前密码（加密）
                      </label>
                      <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                        {editingUser.password.substring(0, 20)}...
                      </div>
                    </div>
                  )}
              </div>

              {/* 角色选择 */}
              {editingUser.name !== SUPER_ADMIN_NAME &&
                canAssignRole(currentRole, "admin") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      用户角色
                    </label>
                    <div className="flex gap-2">
                      {currentRole === "superadmin" && (
                        <button
                          type="button"
                          onClick={() => setEditRole("admin")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            editRole === "admin"
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          管理员
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditRole("user")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          editRole === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        普通用户
                      </button>
                    </div>
                  </div>
                )}

              {/* 模块权限 - 仅对普通用户可编辑 */}
              {editRole === "user" &&
                canManageUser(currentRole, editingUser.role) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      模块权限（普通用户需要分配权限才能访问对应模块）
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {getAllModulePermissions()
                        .filter(
                          (m) =>
                            m.key !== "dashboard" &&
                            m.key !== "settings" &&
                            m.key !== "userManagement",
                        )
                        .map((module) => (
                          <label
                            key={module.key}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                              editPermissions.includes(module.key)
                                ? "bg-blue-50 border-2 border-blue-500 dark:bg-blue-900/30"
                                : "bg-gray-50 border-2 border-transparent hover:bg-gray-100 dark:bg-gray-800"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={editPermissions.includes(module.key)}
                              onChange={() => togglePermission(module.key)}
                              className="rounded border-gray-300"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {module.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {module.description}
                              </div>
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  取消
                </Button>
                <Button onClick={handleSaveUser} isLoading={isEditing}>
                  保存更改
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>
            系统中所有注册用户 (共 {users.length} 人)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无用户</div>
          ) : (
            <div className="space-y-4">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <span className="text-lg font-medium text-blue-600 dark:text-blue-400">
                          {u.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {u.name}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${getRoleStyle(u.role)}`}
                          >
                            {ROLE_NAMES[u.role]}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          创建于{" "}
                          {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canManageUser(currentRole, u.role) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditUser(u)}
                        >
                          编辑
                        </Button>
                      )}
                      {canDeleteUser(
                        currentRole,
                        u.role,
                        user?.id === u.id,
                      ) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDeleteUser(u)}
                        >
                          删除
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 显示用户权限 */}
                  {u.role === "user" &&
                    u.permissions &&
                    u.permissions.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-gray-500 mb-1">
                          拥有权限:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {u.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            >
                              {MODULE_PERMISSIONS[perm]?.name || perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {u.role === "user" &&
                    (!u.permissions || u.permissions.length === 0) && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-gray-400">
                          仅有默认权限（仪表盘、账户设置）
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
