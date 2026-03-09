"use client";

import { Input } from "@/components/ui/input";

interface NumberInputFieldProps {
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

export function NumberInputField({ field, value, onChange }: NumberInputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      <Input
        type="number"
        placeholder={field.defaultValue || "0"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
