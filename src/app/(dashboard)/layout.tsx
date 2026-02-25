"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] grid-bg">
        <div className="text-center">
          <div className="text-4xl text-[var(--primary)] animate-pulse mb-4">
            ◈
          </div>
          <p className="text-[var(--foreground)] opacity-50 tracking-widest text-sm">
            INITIALIZING SYSTEM...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <Sidebar />
      <main className="lg:pl-64 pt-16 pb-20 lg:pb-0">
        <div className="p-4 md:p-6">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
