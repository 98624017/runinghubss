"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { History, Settings, Menu, Palette } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { TaskPanel } from "./task-panel";

const navLinks = [
  { href: "/workspace", label: "工作台", icon: Palette },
  { href: "/history", label: "历史", icon: History },
  { href: "/settings", label: "设置", icon: Settings },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* 移动端汉堡菜单 */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "md:hidden mr-2"
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">菜单</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="px-4 pt-4 text-lg font-bold">
              悦安居
            </SheetTitle>
            <Separator className="my-2" />
            <nav className="flex flex-col gap-1 p-2">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-primary" : ""
                      )}
                    />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <Separator className="my-2" />
            <div className="px-4 py-2">
              <TaskPanel />
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <Image src="/images/logo.png" alt="悦安居" width={28} height={28} className="rounded" />
          <span className="font-bold text-lg hidden sm:inline">悦安居</span>
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  buttonVariants({
                    variant: isActive ? "secondary" : "ghost",
                    size: "sm",
                  }),
                  "gap-2",
                  isActive && "text-primary font-medium"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 右侧工具区 */}
        <div className="ml-auto flex items-center gap-1">
          <TaskPanel />
        </div>
      </div>
    </header>
  );
}
