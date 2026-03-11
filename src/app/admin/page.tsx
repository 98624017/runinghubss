"use client";

import { useEffect, useState } from "react";
import { adminApiClient } from "@/lib/admin-api-client";
import { AppWindow, Key, Settings, Webhook } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardData {
  appsCount: number;
  keysCount: number;
  defaultMultiplier: string;
  webhookEnabled: boolean;
  apps: Array<{ id: string; name: string; icon: string; enabled: boolean }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchDashboard() {
      const [appsResult, keysResult, settingsResult] = await Promise.all([
        adminApiClient<
          Array<{ id: string; name: string; icon: string; enabled: boolean }>
        >("/api/admin/apps"),
        adminApiClient<Array<{ id: string }>>("/api/admin/keys"),
        adminApiClient<Array<{ key: string; value: string }>>(
          "/api/admin/settings"
        ),
      ]);
      if (cancelled) return;

      const apps = appsResult.data ?? [];
      const keys = keysResult.data ?? [];
      const settings = settingsResult.data ?? [];

      const settingsMap: Record<string, string> = {};
      for (const s of settings) {
        settingsMap[s.key] = s.value;
      }

      setData({
        appsCount: apps.filter((a) => a.enabled).length,
        keysCount: keys.length,
        defaultMultiplier: settingsMap.defaultMultiplier ?? "1",
        webhookEnabled: settingsMap.webhookEnabled === "true",
        apps,
      });
    }
    void fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const STAT_CARDS = [
    {
      label: "启用应用数",
      value: data?.appsCount ?? null,
      icon: AppWindow,
      href: "/admin/apps",
    },
    {
      label: "已配置 Key",
      value: data?.keysCount ?? null,
      icon: Key,
      href: "/admin/keys",
    },
    {
      label: "全局倍率",
      value: data ? `${data.defaultMultiplier}x` : null,
      icon: Settings,
      href: "/admin/settings",
    },
    {
      label: "Webhook",
      value: data ? (data.webhookEnabled ? "已开启" : "未开启") : null,
      icon: Webhook,
      href: "/admin/settings",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card className="hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  {card.value !== null ? (
                    <p className="text-2xl font-bold">{card.value}</p>
                  ) : (
                    <Skeleton className="h-8 w-16" />
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* 应用快速列表 */}
      {data && data.apps.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">应用列表</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.apps.map((app) => (
              <Link key={app.id} href={`/admin/apps/${app.id}/edit`}>
                <Card className="hover:border-primary/50 hover:shadow-sm transition-all duration-200">
                  <CardContent className="flex items-center gap-3 py-3">
                    <span className="text-2xl">{app.icon}</span>
                    <span className="text-sm font-medium">{app.name}</span>
                    {!app.enabled && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        (已禁用)
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
