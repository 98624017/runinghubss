"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, animate } from "motion/react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // 初始自动演示动画
  useEffect(() => {
    if (hasAnimated) return;
    setHasAnimated(true);

    const controls = animate(30, 70, {
      duration: 1.2,
      ease: "easeInOut",
      onUpdate: (v) => setPosition(v),
      onComplete: () => {
        animate(70, 50, {
          duration: 0.8,
          ease: "easeInOut",
          onUpdate: (v) => setPosition(v),
        });
      },
    });

    return () => controls.stop();
  }, [hasAnimated]);

  const updatePosition = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(pct);
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      updatePosition(e.clientX);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [updatePosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    },
    [isDragging, updatePosition]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl shadow-2xl shadow-amber-500/10 select-none cursor-ew-resize aspect-[4/3] max-w-4xl mx-auto ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* After 图片（底层） */}
      <div className="absolute inset-0">
        <Image
          src={afterImage}
          alt={afterLabel}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 896px"
          priority
        />
      </div>

      {/* Before 图片（裁剪层） */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={beforeImage}
          alt={beforeLabel}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 896px"
          priority
        />
      </div>

      {/* 分割手柄 */}
      <motion.div
        className="absolute top-0 bottom-0 z-10 flex items-center"
        style={{ left: `${position}%` }}
        animate={{ left: `${position}%` }}
        transition={{ duration: 0 }}
      >
        {/* 竖线 */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500 -translate-x-1/2" />
        {/* 圆形拖拽按钮 */}
        <div className="relative -translate-x-1/2 w-10 h-10 rounded-full bg-amber-500 shadow-lg shadow-amber-500/30 flex items-center justify-center">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-white"
          >
            <path
              d="M4.5 3L1 8L4.5 13M11.5 3L15 8L11.5 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </motion.div>

      {/* 左右标签 */}
      <div className="absolute bottom-4 left-4 z-10 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-xs text-white font-medium">
        {beforeLabel}
      </div>
      <div className="absolute bottom-4 right-4 z-10 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-xs text-white font-medium">
        {afterLabel}
      </div>
    </div>
  );
}
