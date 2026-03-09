import { Upload, Sparkles, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "上传素材",
    description: "上传平面图、毛坯照片或参考图片",
  },
  {
    icon: Sparkles,
    title: "AI 生成",
    description: "选择 AI 应用，一键提交，等待生成",
  },
  {
    icon: Download,
    title: "下载成果",
    description: "预览效果图，满意即可下载高清原图",
  },
];

export function Workflow() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">三步出图</h2>
          <p className="text-muted-foreground">简单三步，快速获得专业效果图</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <div key={title} className="text-center">
              <div className="relative mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-7 w-7 text-primary" />
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
