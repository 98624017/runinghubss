import { Fragment } from "react";
import { Upload, Sparkles, Download } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: Upload,
    title: "上传素材",
    description: "上传平面图、毛坯照片或参考图片",
    details: ["支持 JPG/PNG/CAD 格式", "批量上传多张参考图", "自动识别图片类型"],
  },
  {
    icon: Sparkles,
    title: "AI 生成",
    description: "选择 AI 应用，一键提交，等待生成",
    details: ["多款专业 AI 应用可选", "智能风格匹配", "AI 智能加速出图"],
  },
  {
    icon: Download,
    title: "下载成果",
    description: "预览效果图，满意即可下载高清原图",
    details: ["高清无水印下载", "支持多种输出格式", "历史记录随时回看"],
  },
];

function StepArrow() {
  return (
    <div className="hidden md:flex items-center justify-center">
      <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
        <line
          x1="0"
          y1="12"
          x2="48"
          y2="12"
          stroke="currentColor"
          strokeDasharray="6 4"
          className="text-primary/30"
        />
        <polygon
          points="48,12 42,16 42,8"
          fill="currentColor"
          className="text-primary/50"
        />
      </svg>
    </div>
  );
}

function VerticalArrow() {
  return (
    <div className="flex md:hidden items-center justify-center py-2">
      <svg width="24" height="40" viewBox="0 0 24 40" fill="none">
        <line
          x1="12"
          y1="0"
          x2="12"
          y2="30"
          stroke="currentColor"
          strokeDasharray="6 4"
          className="text-primary/30"
        />
        <polygon
          points="12,30 16,24 8,24"
          fill="currentColor"
          className="text-primary/50"
        />
      </svg>
    </div>
  );
}

export function Workflow() {
  return (
    <section id="workflow" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* 标题区 */}
        <BlurFade inView>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-primary uppercase mb-3 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              使用流程
            </div>
            <h2 className="text-3xl font-bold mb-4 md:text-4xl">三步出图</h2>
            <p className="text-muted-foreground">
              简单三步，快速获得专业效果图
            </p>
          </div>
        </BlurFade>

        {/* 步骤 */}
        <div className="max-w-4xl mx-auto">
          {/* 桌面端：横排 */}
          <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-4">
            {steps.map(({ icon: Icon, title, description, details }, index) => (
              <Fragment key={title}>
                <BlurFade delay={index * 0.3} inView>
                  <Card className="p-6 text-center h-full">
                    {/* 步骤圆圈 */}
                    <div className="relative mx-auto mb-5 w-fit">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{title}</h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      {description}
                    </p>
                    <ul className="space-y-1">
                      {details.map((d) => (
                        <li
                          key={d}
                          className="text-sm text-muted-foreground/70"
                        >
                          {d}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </BlurFade>
                {index < steps.length - 1 && (
                  <StepArrow key={`arrow-${index}`} />
                )}
              </Fragment>
            ))}
          </div>

          {/* 移动端：纵排 */}
          <div className="flex flex-col md:hidden">
            {steps.map(({ icon: Icon, title, description, details }, index) => (
              <div key={title}>
                <BlurFade delay={index * 0.3} inView>
                  <Card className="p-6 text-center">
                    <div className="relative mx-auto mb-5 w-fit">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{title}</h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      {description}
                    </p>
                    <ul className="space-y-1">
                      {details.map((d) => (
                        <li
                          key={d}
                          className="text-sm text-muted-foreground/70"
                        >
                          {d}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </BlurFade>
                {index < steps.length - 1 && <VerticalArrow />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
