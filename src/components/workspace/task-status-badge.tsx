"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { TaskStatus } from "@/lib/constants";

const STATUS_CONFIG: Record<TaskStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  QUEUED: { label: "排队中", variant: "secondary", icon: Clock },
  RUNNING: { label: "生成中", variant: "default", icon: Loader2 },
  SUCCESS: { label: "已完成", variant: "outline", icon: CheckCircle2 },
  FAILED: { label: "失败", variant: "destructive", icon: XCircle },
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className={`h-3 w-3 mr-1 ${status === "RUNNING" ? "animate-spin" : ""}`} />
      {config.label}
    </Badge>
  );
}
