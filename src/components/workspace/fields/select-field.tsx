"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const CHIP_THRESHOLD = 8;

export function SelectField({ field, value, onChange }: SelectFieldProps) {
  let options: string[] = [];
  try {
    if (field.options) {
      options = JSON.parse(field.options);
    }
  } catch {
    options = [];
  }

  const selectedValue = value || field.defaultValue || "";
  const useChipMode = options.length > 0 && options.length <= CHIP_THRESHOLD;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}

      {useChipMode ? (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm border transition-colors",
                selectedValue === opt
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <Select
          value={selectedValue}
          onValueChange={(v) => onChange(v ?? "")}
        >
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
      )}
    </div>
  );
}
