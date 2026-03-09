"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Palette, Repeat, Layers, Home, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

interface AppItem {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  palette: Palette,
  repeat: Repeat,
  layers: Layers,
  home: Home,
  sparkles: Sparkles,
};

export function Sidebar() {
  const pathname = usePathname();
  const [apps, setApps] = useState<AppItem[]>([]);

  useEffect(() => {
    fetch("/api/apps")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setApps(data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="hidden md:flex w-56 flex-col border-r bg-muted/30">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-muted-foreground">AI 应用</h2>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-2">
          {apps.map((app) => {
            const Icon = iconMap[app.icon] || Sparkles;
            const isActive = pathname === `/workspace/${app.id}`;
            return (
              <Link
                key={app.id}
                href={`/workspace/${app.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                  isActive && "bg-accent text-accent-foreground font-medium"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{app.name}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
