import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";
import { ShimmerButton } from "@/components/ui/shimmer-button";

export function CtaSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-background relative overflow-hidden">
      {/* 装饰光晕 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative container mx-auto px-4 text-center">
        <BlurFade inView>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            让 AI 释放你的设计潜能
          </h2>
        </BlurFade>
        <BlurFade inView delay={0.1}>
          <p className="mt-4 text-lg text-slate-200 max-w-lg mx-auto">
            从 CAD 平面图到精美效果图，只需一分钟
          </p>
        </BlurFade>
        <BlurFade inView delay={0.2}>
          <div className="mt-8">
            <Link href="/workspace">
              <ShimmerButton
                shimmerColor="#f59e0b"
                background="rgba(245, 158, 11, 1)"
                className="h-14 px-10 text-lg font-semibold"
              >
                立即体验 →
              </ShimmerButton>
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            无需安装，浏览器直接使用
          </p>
        </BlurFade>
      </div>
    </section>
  );
}
