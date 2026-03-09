"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">出错了</h1>
        <p className="text-muted-foreground">
          {error.message || "发生了意外错误，请稍后重试"}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>重试</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}
