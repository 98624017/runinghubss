"use client";

import { Switch } from "@/components/ui/switch";

interface SwitchFieldProps {
  field: {
    id: string;
    label: string;
    description: string;
    required: boolean;
    defaultValue: string | null;
  };
  value: string;
  onChange: (value: string) => void;
}

export function SwitchField({ field, value, onChange }: SwitchFieldProps) {
  const checked = value === "true" || (value === "" && field.defaultValue === "true");

  return (
    <div className="flex items-center justify-between space-y-0 rounded-lg border p-3">
      <div className="space-y-0.5">
        <label className="text-sm font-medium">{field.label}</label>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={(v) => onChange(String(v))}
      />
    </div>
  );
}
