"use client";

import { useState, useEffect, useCallback } from "react";
import { BookmarkPlus, ChevronDown, Trash2, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTemplates, addTemplate, deleteTemplate } from "@/lib/db";
import type { Template } from "@/lib/types";
import { toast } from "sonner";

interface TemplateSelectorProps {
  appId: string;
  apiKeyHash: string;
  currentValues: Record<string, string>; // 当前表单值
  imageFieldIds: string[]; // 需要过滤的图片字段 ID
  onLoadTemplate: (values: Record<string, string>) => void; // 加载模板时回调
}

export function TemplateSelector({
  appId,
  apiKeyHash,
  currentValues,
  imageFieldIds,
  onLoadTemplate,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);

  // 加载模板列表
  const loadTemplates = useCallback(async () => {
    if (!apiKeyHash || !appId) return;
    try {
      const list = await getTemplates(apiKeyHash, appId);
      setTemplates(list);
    } catch (err) {
      console.error("加载模板列表失败:", err);
    }
  }, [apiKeyHash, appId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // 保存为模板
  const handleSave = async () => {
    if (saving) return; // 防止重复提交

    const name = templateName.trim();
    if (!name) {
      toast.error("请输入模板名称");
      return;
    }

    setSaving(true);
    try {
      // 过滤掉图片字段，只保存非图片字段值
      const imageFieldSet = new Set(imageFieldIds);
      const filteredValues: Record<string, string> = {};
      for (const [key, value] of Object.entries(currentValues)) {
        if (!imageFieldSet.has(key)) {
          filteredValues[key] = value;
        }
      }

      const now = new Date();
      await addTemplate({
        name,
        appId,
        apiKeyHash,
        values: filteredValues,
        createdAt: now,
        updatedAt: now,
      });

      toast.success(`模板「${name}」已保存`);
      setTemplateName("");
      setSaveDialogOpen(false);
      await loadTemplates();
    } catch (err) {
      console.error("保存模板失败:", err);
      toast.error("保存模板失败");
    } finally {
      setSaving(false);
    }
  };

  // 删除模板
  const handleDelete = async (e: React.MouseEvent, template: Template) => {
    // 阻止事件冒泡，避免触发 DropdownMenuItem 的点击
    e.stopPropagation();

    if (!template.id) return;
    try {
      await deleteTemplate(template.id);
      toast.success(`模板「${template.name}」已删除`);
      await loadTemplates();
    } catch (err) {
      console.error("删除模板失败:", err);
      toast.error("删除模板失败");
    }
  };

  // 加载模板
  const handleLoadTemplate = (template: Template) => {
    onLoadTemplate(template.values);
    toast.success(`已加载模板「${template.name}」`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
        >
          <FileText className="h-4 w-4" />
          模板
          <ChevronDown className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>已保存的模板</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          {templates.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              暂无模板
            </div>
          ) : (
            templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                className="flex items-center justify-between gap-2"
                onClick={() => handleLoadTemplate(template)}
              >
                <span className="truncate">{template.name}</span>
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-focus/dropdown-menu-item:opacity-100"
                  onClick={(e) => handleDelete(e, template)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setSaveDialogOpen(true)}
          >
            <BookmarkPlus className="h-4 w-4" />
            保存当前参数为模板
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 保存模板命名对话框 */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>保存为模板</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="template-name">模板名称</Label>
              <Input
                id="template-name"
                placeholder="输入模板名称"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              图片类型字段不会保存到模板中
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
