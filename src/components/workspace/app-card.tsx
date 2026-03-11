"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

const defaultCover = "/images/gallery/gallery-minimal-living.webp";

/** 内置封面图映射 — 确保即使数据库未配置也有默认封面 */
const builtinCoverMap: Record<string, string> = {
  "一键彩平": "/images/covers/5a6c5e85-e321-4330-96c9-5142510f66bf.webp",
  "外观迁移": "/images/covers/8dee86eb-d9bc-4bf7-a830-42bf4156f588.webp",
  "平面转效果": "/images/covers/8fdab9da-4209-4885-b35d-2b6cdfa098aa.webp",
  "毛坯转效果": "/images/covers/49bf77b6-6fe4-4fa2-93c0-b848d43e965c.webp",
};

interface AppCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  coverImage?: string;
}

export function AppCard({ id, name, description, coverImage }: AppCardProps) {
  const cover = coverImage || builtinCoverMap[name] || defaultCover;

  return (
    <Link
      href={`/workspace/${id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "aspect-[3/4]",
          "hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10",
          "transition-all duration-300"
        )}
      >
        {/* 背景图 — 定位偏上，展示图片精华区域 */}
        <Image
          src={cover}
          alt={name}
          fill
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* 底部暗角 — 从底部 45% 开始渐变，文字区域足够暗 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 via-[45%] to-transparent" />

        {/* 底部文字 — 位于深色区域底部 */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-16">
          <h3 className="text-lg font-semibold text-white mb-1.5">
            {name}
          </h3>
          <p className="text-sm text-white/75 line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* hover 时展示的操作提示 */}
          <div className="flex items-center gap-1.5 mt-3 text-sm font-medium text-amber-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            开始使用
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
