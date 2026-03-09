"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, Menu } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "功能", href: "#features" },
  { label: "作品", href: "#gallery" },
  { label: "流程", href: "#workflow" },
  { label: "评价", href: "#testimonials" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* 品牌 */}
        <Link href="/" className="flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-foreground">悦安居</span>
        </Link>

        {/* 桌面端导航 */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* 桌面端 CTA */}
        <div className="hidden md:block">
          <Link
            href="/workspace"
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            开始使用
          </Link>
        </div>

        {/* 移动端汉堡菜单 */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "md:hidden"
            )}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <SheetTitle className="text-lg font-bold">导航</SheetTitle>
            <nav className="mt-8 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/workspace"
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                开始使用
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
