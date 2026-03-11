import Link from "next/link";
import { Palette, Repeat, Layers, Home, ArrowRight } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const features = [
  {
    icon: Palette,
    title: "一键彩平",
    description: "CAD平面白图填色变立体，保持图纸一致性，快速呈现专业效果",
  },
  {
    icon: Repeat,
    title: "外观迁移",
    description: "从参考图中精准提取风格，应用到原始图像上，实现设计风格统一",
  },
  {
    icon: Layers,
    title: "平面转效果",
    description: "支持最多9张图融合参考，AI 智能理解空间关系，生成室内效果图",
  },
  {
    icon: Home,
    title: "毛坯转效果",
    description: "一键将毛坯房照片生成装修效果图，让客户提前看到未来的家",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-background pointer-events-none" />

      <div className="relative container mx-auto px-4">
        {/* 标题区 */}
        <BlurFade inView>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-primary uppercase mb-3 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              核心功能
            </div>
            <h2 className="text-3xl font-bold mb-4 md:text-4xl">
              核心 AI 应用
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              覆盖家装设计全流程，从平面图到效果图，满足各种设计需求
            </p>
          </div>
        </BlurFade>

        {/* 卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, description }, index) => (
            <BlurFade key={title} delay={index * 0.1} inView>
              <Card className="h-full hover:border-primary/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1" />
                <CardFooter className="border-t-0 bg-transparent">
                  <Link
                    href="/workspace"
                    className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-colors"
                  >
                    了解更多
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardFooter>
              </Card>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
