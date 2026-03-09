import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-6">
          <Sparkles className="h-4 w-4" />
          AI 赋能室内设计
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl mb-6">
          悦安居
          <br />
          <span className="text-muted-foreground text-3xl md:text-4xl lg:text-5xl">
            家装软装自动出图平台
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8">
          一键生成专业效果图，从 CAD 平面图到精美渲染，
          从毛坯房到梦想家。让 AI 释放你的设计潜能。
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/workspace">
            <Button size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              开始使用
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg">
              了解更多
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
