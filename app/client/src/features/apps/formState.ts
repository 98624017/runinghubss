import type { AppDefinition, AppFieldType, DynamicFormValues } from '../../types';

export type AppFieldGroup = {
  key: string;
  title: string;
  fields: NonNullable<AppDefinition['fields']>;
};

function getDefaultFieldValue(type: AppFieldType) {
  switch (type) {
    case 'boolean':
      return false;
    case 'text':
      return '';
    case 'file':
    default:
      return null;
  }
}

export function createInitialFormValues(app: AppDefinition): DynamicFormValues {
  return (app.fields ?? []).reduce<DynamicFormValues>((accumulator, field) => {
    if (field.type === 'file') {
      accumulator[field.key] = null;
      return accumulator;
    }

    accumulator[field.key] = field.defaultValue ?? getDefaultFieldValue(field.type);
    return accumulator;
  }, {});
}

export function hasRequiredFieldsReady(
  app: AppDefinition,
  values: DynamicFormValues,
): boolean {
  return (app.fields ?? []).every((field) => {
    if (!field.required) {
      return true;
    }

    const value = values[field.key];

    switch (field.type) {
      case 'file':
        return value instanceof File;
      case 'text':
        return typeof value === 'string' && value.trim().length > 0;
      case 'boolean':
        return typeof value === 'boolean';
      default:
        return false;
    }
  });
}

function inferFieldGroupTitle(field: NonNullable<AppDefinition['fields']>[number]) {
  if (typeof field.group === 'string' && field.group.trim()) {
    return field.group;
  }

  if (field.type === 'file') {
    return '上传素材';
  }

  if (field.key === 'width' || field.key === 'height') {
    return '尺寸设置';
  }

  return '创作参数';
}

export function groupAppFields(app: AppDefinition): AppFieldGroup[] {
  const groups = new Map<string, AppFieldGroup>();

  // 按 schema 分组渲染，优先使用显式 group，其次按字段语义兜底。
  for (const field of app.fields ?? []) {
    const title = inferFieldGroupTitle(field);
    const key = title;
    const currentGroup = groups.get(key);

    if (currentGroup) {
      currentGroup.fields.push(field);
      continue;
    }

    groups.set(key, {
      key,
      title,
      fields: [field],
    });
  }

  return [...groups.values()];
}
