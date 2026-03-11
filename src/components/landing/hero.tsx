"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { buttonVariants } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BeforeAfterSlider } from "@/components/landing/before-after-slider";
import { cn } from "@/lib/utils";

const stats = [
  { value: 99, suffix: "%", label: "出图成功率" },
  { value: 2, suffix: "K+", label: "高清分辨率" },
  { value: 100, suffix: "%", label: "高清品质" },
];

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen overflow-hidden flex items-center"
    >
      {/* 深色渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950" />

      {/* 网格点阵 */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* 飘动光晕 */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[120px] pointer-events-none"
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 15, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none"
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 20, -10, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 内容层 */}
      <div className="relative z-10 container mx-auto px-4 pt-32 pb-20">
        <div className="text-center">
          {/* Badge */}
          <BlurFade delay={0}>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400 mb-8 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              AI 赋能室内设计
            </div>
          </BlurFade>

          {/* 主标题 */}
          <BlurFade delay={0.1}>
            <h1 className="text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl mb-6 leading-tight">
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                悦安居
              </span>
              <br />
              <span className="text-white/80 text-3xl md:text-4xl lg:text-5xl font-medium tracking-normal">
                家装软装自动出图平台
              </span>
            </h1>
          </BlurFade>

          {/* 副标题 */}
          <BlurFade delay={0.15}>
            <p className="mx-auto max-w-2xl text-lg text-white/70 mb-10 leading-relaxed">
              一键生成专业效果图，从 CAD 平面图到精美渲染，
              从毛坯房到梦想家。让 AI 释放你的设计潜能。
            </p>
          </BlurFade>

          {/* CTA 按钮组 */}
          <BlurFade delay={0.2}>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/workspace"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold shadow-xl shadow-amber-500/30 hover:shadow-amber-400/40 hover:scale-105 transition-all duration-200"
                )}
              >
                <Sparkles className="h-4 w-4" />
                开始使用
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40 backdrop-blur-sm transition-all duration-200"
                )}
              >
                了解更多
              </a>
            </div>
          </BlurFade>
        </div>

        {/* Before/After Slider */}
        <BlurFade delay={0.3}>
          <div className="mt-16">
            <BeforeAfterSlider
              beforeImage="/images/gallery/before-room.webp"
              afterImage="/images/gallery/after-room.webp"
              beforeLabel="毛坯房"
              afterLabel="AI 效果图"
            />
          </div>
        </BlurFade>

        {/* 统计栏 */}
        <BlurFade delay={0.4}>
          <div className="mt-16 flex justify-center gap-12 md:gap-20 flex-wrap">
            {stats.map(({ value, suffix, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-amber-300">
                  <NumberTicker value={value} delay={0.5} />
                  <span>{suffix}</span>
                </div>
                <div className="text-sm text-white/60 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </BlurFade>
      </div>

      {/* 底部渐变过渡 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
