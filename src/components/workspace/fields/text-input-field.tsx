"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TextInputFieldProps {
  field: {
    id: string;
    label: string;
    description: string;
    required: boolean;
    defaultValue: string | null;
    fieldName: string;
  };
  value: string;
  onChange: (value: string) => void;
}

export function TextInputField({ field, value, onChange }: TextInputFieldProps) {
  // prompt 类型用 Textarea
  const isPrompt = field.fieldName === "prompt" || field.fieldName === "text";

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      {isPrompt ? (
        <Textarea
          placeholder={field.defaultValue || `请输入${field.label}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <Input
          placeholder={field.defaultValue || `请输入${field.label}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
