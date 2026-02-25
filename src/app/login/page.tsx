"use client";

import { useState } from "react";
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
  CardFooter,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "登录失败");
      }

      setUser(data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-md">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
              <span className="text-3xl">🚀</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              神奇妙妙屋
            </h1>
            <p className="text-[var(--foreground)] mt-2 opacity-60 text-sm">
              欢迎回来，请登录你的账户
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-[var(--error)]/10 border border-[var(--error)] text-[var(--error)] text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  用户名
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="请输入用户名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] placeholder-gray-400 focus:border-[var(--primary)] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  密码
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] placeholder-gray-400 focus:border-[var(--primary)] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-md bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "登录中..." : "登录"}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--border)] text-center">
            <p className="text-xs text-[var(--foreground)] opacity-40">
              如需注册账户，请联系管理员
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
