import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Repeat, Layers, Home } from "lucide-react";

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
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">四大 AI 应用</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            覆盖家装设计全流程，从平面图到效果图，满足各种设计需求
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="text-center hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
