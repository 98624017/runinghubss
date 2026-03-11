"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ONBOARDED_KEY = "yueanji-onboarded";

interface OnboardingStep {
  title: string;
  description: string;
  target: string; // 目标元素描述，用于定位
}

const STEPS: OnboardingStep[] = [
  {
    title: "选择应用",
    description: "在左侧边栏选择你需要的 AI 生成应用",
    target: "sidebar",
  },
  {
    title: "填写参数",
    description: "在表单中填写风格、材质等参数",
    target: "form",
  },
  {
    title: "上传图片",
    description: "上传需要处理的原始图片素材",
    target: "upload",
  },
  {
    title: "查看结果",
    description: "在右侧面板查看 AI 生成的效果图",
    target: "result",
  },
];

export function OnboardingGuide() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(ONBOARDED_KEY);
  });
  const [step, setStep] = useState(0);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(ONBOARDED_KEY, "true");
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleDismiss();
    }
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <>
      {/* 遮罩层 */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={handleDismiss} />

      {/* 引导卡片 - 居中显示 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 rounded-lg border bg-card p-6 shadow-xl">
        <button
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-4">
          {/* 步骤指示器 */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          <div>
            <h3 className="text-lg font-semibold">{current.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {current.description}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {step + 1} / {STEPS.length}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                跳过
              </Button>
              <Button size="sm" onClick={handleNext}>
                {step < STEPS.length - 1 ? "下一步" : "开始使用"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
