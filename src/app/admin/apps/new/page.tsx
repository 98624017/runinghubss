"use client";

import { AppForm } from "@/components/admin/app-form";

export default function NewAppPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">新建应用</h1>
      <AppForm mode="create" />
    </div>
  );
}
