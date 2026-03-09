"use client";

import { ImageUploader } from "./image-uploader";
import { TextInputField } from "./text-input-field";
import { NumberInputField } from "./number-input-field";
import { SelectField } from "./select-field";
import { SwitchField } from "./switch-field";

interface FieldDef {
  id: string;
  nodeId: string;
  fieldName: string;
  fieldType: string;
  label: string;
  description: string;
  required: boolean;
  defaultValue: string | null;
  options: string | null;
  sortOrder: number;
}

interface FieldRendererProps {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
}

export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  switch (field.fieldType) {
    case "IMAGE":
      return <ImageUploader field={field} value={value} onChange={onChange} />;
    case "STRING":
      return <TextInputField field={field} value={value} onChange={onChange} />;
    case "INT":
      return <NumberInputField field={field} value={value} onChange={onChange} />;
    case "LIST":
      return <SelectField field={field} value={value} onChange={onChange} />;
    case "BOOLEAN":
      return <SwitchField field={field} value={value} onChange={onChange} />;
    default:
      return null;
  }
}
