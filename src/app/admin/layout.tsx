"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/stores/admin-store";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  AppWindow,
  Key,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "概览", href: "/admin", icon: LayoutDashboard },
  { label: "应用管理", href: "/admin/apps", icon: AppWindow },
  { label: "Key 倍率", href: "/admin/keys", icon: Key },
  { label: "系统设置", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAdminStore((s) => s.token);
  const clearToken = useAdminStore((s) => s.clearToken);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [mounted, token, pathname, router]);

  // 登录页面不需要后台布局
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // 未登录或未挂载时显示空白
  if (!mounted || !token) {
    return null;
  }

  const handleLogout = () => {
    clearToken();
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-screen flex">
      {/* 侧边栏 */}
      <aside className="w-56 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">悦安居后台</h2>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
