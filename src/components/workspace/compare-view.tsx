"use client";

import { useRef, useState, useCallback } from "react";

interface CompareViewProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function CompareView({
  beforeImage,
  afterImage,
  beforeLabel = "原图",
  afterLabel = "效果图",
}: CompareViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  // 使用 ref 追踪拖拽状态，避免 useCallback 闭包捕获过期的 isDragging
  const isDraggingRef = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDraggingRef.current = true;
      updatePosition(e.clientX);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [updatePosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg border select-none cursor-ew-resize aspect-[4/3]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* After 图片（底层） */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterImage}
          alt={afterLabel}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Before 图片（裁剪层） */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full object-contain"
        />
      </div>

      {/* 分割线 + 拖拽手柄 */}
      <div
        className="absolute top-0 bottom-0 flex items-center"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-0 bottom-0 w-0.5 bg-white -translate-x-1/2 shadow" />
        <div className="relative -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M4.5 3L1 8L4.5 13M11.5 3L15 8L11.5 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 左右标签 */}
      <div className="absolute bottom-3 left-3 z-10 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-0.5 text-xs text-white">
        {beforeLabel}
      </div>
      <div className="absolute bottom-3 right-3 z-10 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-0.5 text-xs text-white">
        {afterLabel}
      </div>
    </div>
  );
}
