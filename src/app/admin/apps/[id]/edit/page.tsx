"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppForm } from "@/components/admin/app-form";
import { adminApiClient } from "@/lib/admin-api-client";
import type { FieldConfig } from "@/components/admin/field-editor";

interface AppDetail {
  id: string;
  name: string;
  description: string;
  icon: string;
  rhAppId: string;
  category: string;
  coverImage?: string;
  sortOrder: number;
  enabled: boolean;
  fields: Array<{
    nodeId: string;
    fieldName: string;
    fieldType: string;
    label: string;
    description: string;
    required: boolean;
    defaultValue: string | null;
    options: string | null;
    sortOrder: number;
  }>;
}

export default function EditAppPage() {
  const params = useParams();
  const id = params.id as string;
  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApiClient<AppDetail>(`/api/admin/apps/${id}`)
      .then((result) => {
        if (result.success && result.data) {
          setApp(result.data);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-6 text-muted-foreground">加载中...</div>;
  }

  if (!app) {
    return <div className="p-6 text-muted-foreground">应用不存在</div>;
  }

  const fields: FieldConfig[] = app.fields.map((f) => ({
    ...f,
    defaultValue: f.defaultValue ?? "",
    options: f.options ?? "",
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">编辑应用: {app.name}</h1>
      <AppForm mode="edit" initialData={{ ...app, fields }} />
    </div>
  );
}
