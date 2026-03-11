"use client";

import { Star } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { Marquee } from "@/components/ui/marquee";
import { NumberTicker } from "@/components/ui/number-ticker";

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: "张设计师",
    role: "某装饰公司",
    avatar: "https://i.pravatar.cc/80?img=1",
    content: "出图效果超出预期，客户非常满意，大大提升了我们的签约率。",
    rating: 5,
  },
  {
    name: "李经理",
    role: "地产营销部",
    avatar: "https://i.pravatar.cc/80?img=12",
    content: "样板间效果图秒级生成，节省了大量外包成本，效率提升10倍。",
    rating: 5,
  },
  {
    name: "王老师",
    role: "室内设计工作室",
    avatar: "https://i.pravatar.cc/80?img=25",
    content: "CAD彩平功能非常好用，一键上色比手动P图快太多了。",
    rating: 5,
  },
  {
    name: "赵总监",
    role: "家装连锁品牌",
    avatar: "https://i.pravatar.cc/80?img=33",
    content: "毛坯转效果图让客户直观看到装修后的样子，签单率提升了30%。",
    rating: 5,
  },
  {
    name: "陈设计师",
    role: "自由设计师",
    avatar: "https://i.pravatar.cc/80?img=47",
    content: "风格迁移功能太强了，客户给一张参考图就能生成同风格效果图。",
    rating: 5,
  },
  {
    name: "刘主管",
    role: "精装修公司",
    avatar: "https://i.pravatar.cc/80?img=52",
    content: "平面转效果图准确度很高，空间关系处理得非常好，客户都很认可。",
    rating: 4,
  },
  {
    name: "周女士",
    role: "业主",
    avatar: "https://i.pravatar.cc/80?img=5",
    content: "终于能提前看到自己家装修后的样子了，再也不用靠想象了。",
    rating: 5,
  },
  {
    name: "吴设计师",
    role: "软装设计公司",
    avatar: "https://i.pravatar.cc/80?img=60",
    content: "多图融合参考功能很实用，可以精准匹配客户想要的风格。",
    rating: 5,
  },
];

const trustMetrics = [
  { value: 5000, suffix: "+", label: "设计师用户" },
  { value: 50000, suffix: "+", label: "效果图生成" },
  { value: 98, suffix: "%", label: "满意度" },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="bg-white/[0.08] backdrop-blur-sm border border-white/[0.15] rounded-xl p-6 w-[350px] shrink-0">
      {/* 星级 */}
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < testimonial.rating
                ? "text-amber-400 fill-amber-400"
                : "text-white/30"
            }`}
          />
        ))}
      </div>
      {/* 评语 */}
      <p className="text-slate-200 text-sm leading-relaxed mb-4">
        &ldquo;{testimonial.content}&rdquo;
      </p>
      {/* 作者 */}
      <div className="flex items-center gap-3">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="w-8 h-8 rounded-full object-cover"
          loading="lazy"
        />
        <div>
          <p className="text-sm text-slate-300 font-medium">
            {testimonial.name}
          </p>
          <p className="text-xs text-slate-400">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-20 bg-slate-900 relative overflow-hidden"
    >
      {/* 背景纹理 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative container mx-auto px-4">
        {/* 标题 */}
        <BlurFade inView>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                深受设计师信赖
              </span>
            </h2>
            <p className="mt-3 text-slate-300 max-w-md mx-auto">
              来自全国各地设计师的真实反馈
            </p>
          </div>
        </BlurFade>

        {/* 评价滚动 */}
        <Marquee pauseOnHover className="[--duration:30s]">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} testimonial={t} />
          ))}
        </Marquee>

        {/* 信任指标栏 */}
        <BlurFade inView delay={0.3}>
          <div className="mt-16 flex justify-center gap-12 md:gap-20 flex-wrap">
            {trustMetrics.map(({ value, suffix, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">
                  <NumberTicker value={value} delay={0.5} />
                  <span>{suffix}</span>
                </div>
                <div className="text-sm text-white/70 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
