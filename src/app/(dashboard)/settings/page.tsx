"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [profile, setProfile] = useState({
    name: user?.name || "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "更新失败");
      }

      setUser(data.user);
      setMessage({ type: "success", text: "个人信息更新成功" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "更新失败",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: "error", text: "两次输入的新密码不一致" });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage({ type: "error", text: "新密码长度至少6位" });
      return;
    }

    setIsChangingPassword(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "修改密码失败");
      }

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage({ type: "success", text: "密码修改成功" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "修改密码失败",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          账户设置
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          管理您的账户信息和安全设置
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 个人信息 */}
      <Card>
        <CardHeader>
          <CardTitle>个人信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              id="name"
              label="用户名"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="请输入用户名"
            />

            <div className="flex justify-end">
              <Button type="submit" isLoading={isUpdating}>
                保存更改
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 修改密码 */}
      <Card>
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              id="currentPassword"
              type="password"
              label="当前密码"
              value={passwords.currentPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, currentPassword: e.target.value })
              }
              placeholder="请输入当前密码"
              required
            />

            <Input
              id="newPassword"
              type="password"
              label="新密码"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, newPassword: e.target.value })
              }
              placeholder="请输入新密码（至少6位）"
              required
            />

            <Input
              id="confirmPassword"
              type="password"
              label="确认新密码"
              value={passwords.confirmPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, confirmPassword: e.target.value })
              }
              placeholder="请再次输入新密码"
              required
            />

            <div className="flex justify-end">
              <Button type="submit" isLoading={isChangingPassword}>
                修改密码
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 账户信息 */}
      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium">账户ID</p>
                <p className="text-sm text-gray-500">{user?.id}</p>
              </div>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium">账户类型</p>
                <p className="text-sm text-gray-500">
                  {user?.role === "admin" ? "管理员" : "普通用户"}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center py-3">
              <div>
                <p className="font-medium text-red-600">删除账户</p>
                <p className="text-sm text-gray-500">
                  删除后所有数据将被永久移除
                </p>
              </div>
              <Button variant="danger" size="sm">
                删除账户
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
