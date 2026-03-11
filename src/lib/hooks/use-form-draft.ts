"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

const DRAFT_PREFIX = "yueanji-draft-";

/**
 * 表单草稿自动保存 hook
 * - 页面加载时自动恢复上次编辑的非图片字段值（当无 initialValues 时）
 * - 编辑时防抖 1 秒自动保存到 localStorage
 * - 任务提交后调用 clearDraft 清除
 *
 * @param skipRestore 为 true 时跳过草稿恢复（用于重试/复用场景）
 */
export function useFormDraft(
  appId: string,
  values: Record<string, string>,
  setValues: (values: Record<string, string>) => void,
  imageFieldIds: string[] = [],
  skipRestore: boolean = false
) {
  const initialized = useRef(false);
  const key = `${DRAFT_PREFIX}${appId}`;

  // 恢复草稿 — 仅在首次挂载且无需跳过时执行
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 当有 initialValues（重试/复用）时，跳过草稿恢复
    if (skipRestore) return;

    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const draft = JSON.parse(saved) as Record<string, string>;
        // 过滤掉图片字段
        const imageSet = new Set(imageFieldIds);
        const filtered: Record<string, string> = {};
        for (const [k, v] of Object.entries(draft)) {
          if (!imageSet.has(k) && v) {
            filtered[k] = v;
          }
        }
        if (Object.keys(filtered).length > 0) {
          setValues(filtered);
          toast.info("已恢复上次编辑的内容");
        }
      }
    } catch {
      // 忽略解析错误
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自动保存（防抖 1 秒）
  useEffect(() => {
    if (!initialized.current) return;

    // 过滤掉图片字段值后保存
    const imageSet = new Set(imageFieldIds);
    const toSave: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) {
      if (!imageSet.has(k) && v) {
        toSave[k] = v;
      }
    }

    if (Object.keys(toSave).length === 0) return;

    const timer = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(toSave));
    }, 1000);
    return () => clearTimeout(timer);
  }, [key, values, imageFieldIds]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return { clearDraft };
}
