"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SelectFieldProps {
  field: {
    id: string;
    label: string;
    description: string;
    required: boolean;
    defaultValue: string | null;
    options: string | null;
  };
  value: string;
  onChange: (value: string) => void;
}

export function SelectField({ field, value, onChange }: SelectFieldProps) {
  let options: string[] = [];
  try {
    if (field.options) {
      options = JSON.parse(field.options);
    }
  } catch {
    options = [];
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      <Select value={value || field.defaultValue || ""} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger>
          <SelectValue placeholder={`选择${field.label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
