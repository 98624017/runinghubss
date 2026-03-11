"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { Marquee } from "@/components/ui/marquee";

interface GalleryImage {
  src: string;
  category: string;
  title: string;
}

const galleryImages: GalleryImage[] = [
  { src: "/images/gallery/gallery-modern-living.webp", category: "客厅", title: "现代简约客厅" },
  { src: "/images/gallery/gallery-modern-bedroom.webp", category: "卧室", title: "现代轻奢卧室" },
  { src: "/images/gallery/gallery-euro-bedroom.webp", category: "卧室", title: "欧式卧室" },
  { src: "/images/gallery/gallery-chinese-living.webp", category: "餐厅", title: "新中式餐厅" },
  { src: "/images/gallery/gallery-luxury-living.webp", category: "餐厅", title: "轻奢餐厅" },
  { src: "/images/gallery/gallery-kitchen.webp", category: "厨房", title: "现代厨房" },
  { src: "/images/gallery/gallery-bathroom.webp", category: "卫浴", title: "现代卫浴" },
  { src: "/images/gallery/gallery-minimal-living.webp", category: "书房", title: "现代书房" },
  { src: "/images/gallery/gallery-study.webp", category: "书房", title: "古典书房" },
  { src: "/images/gallery/gallery-dressing.webp", category: "衣帽间", title: "精致衣帽间" },
];

const categories = ["全部", "客厅", "卧室", "餐厅", "厨房", "卫浴", "书房", "衣帽间"];

function GalleryCard({ image, priority = false }: { image: GalleryImage; priority?: boolean }) {
  return (
    <div className="relative group rounded-xl overflow-hidden aspect-[4/3] w-[300px] md:w-[400px] shrink-0">
      <Image
        src={image.src}
        alt={image.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 768px) 300px, 400px"
        priority={priority}
      />
      {/* 底部遮罩 */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-white text-sm font-medium">{image.title}</p>
        <p className="text-white/60 text-xs mt-0.5">{image.category}</p>
      </div>
    </div>
  );
}

export function Gallery() {
  const [activeCategory, setActiveCategory] = useState("全部");

  const filtered =
    activeCategory === "全部"
      ? galleryImages
      : galleryImages.filter((img) => img.category === activeCategory);

  // 分两排
  const mid = Math.ceil(filtered.length / 2);
  const topRow = filtered.slice(0, mid);
  const bottomRow = filtered.slice(mid);

  return (
    <section id="gallery" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* 标题区 */}
        <BlurFade inView>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              精选作品
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              AI 生成效果图展示
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              从毛坯到精装，从简约到轻奢，一键生成各种风格效果图
            </p>
          </div>
        </BlurFade>

        {/* 分类 Tab */}
        <BlurFade delay={0.1} inView>
          <div className="flex justify-center gap-2 flex-wrap mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </BlurFade>

        {/* 双排 Marquee */}
        <div className="space-y-6">
          {topRow.length > 0 && (
            <Marquee pauseOnHover className="[--duration:40s]">
              {topRow.map((img, i) => (
                <GalleryCard key={img.src} image={img} />
              ))}
            </Marquee>
          )}
          {bottomRow.length > 0 && (
            <Marquee pauseOnHover reverse className="[--duration:35s]">
              {bottomRow.map((img) => (
                <GalleryCard key={img.src} image={img} />
              ))}
            </Marquee>
          )}
        </div>
      </div>
    </section>
  );
}
