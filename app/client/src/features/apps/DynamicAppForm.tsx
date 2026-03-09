import { useId } from 'react';

import { AcrylicCard } from '../../components/AcrylicCard';
import { FileDropZone } from '../../components/FileDropZone';
import type {
  AppDefinition,
  AppFieldDefinition,
  DynamicFormValue,
  DynamicFormValues,
} from '../../types';

type DynamicAppFormProps = {
  app: AppDefinition;
  value: DynamicFormValues;
  onChange: (nextValue: DynamicFormValues) => void;
  fields?: AppFieldDefinition[];
  title?: string;
  eyebrow?: string;
  description?: string;
};

function readBooleanValue(rawValue: DynamicFormValue) {
  return typeof rawValue === 'boolean' ? rawValue : false;
}

function readTextValue(rawValue: DynamicFormValue) {
  return typeof rawValue === 'string' ? rawValue : '';
}

function readFileValue(rawValue: DynamicFormValue) {
  return rawValue instanceof File ? rawValue : null;
}

function buildBooleanAriaLabel(app: AppDefinition, key: string, fallbackLabel: string) {
  if (app.id === '2011111632956563457' && key === 'enable8k') {
    return '开启8K，默认4K';
  }
  return fallbackLabel;
}

function useMultilineField(field: AppFieldDefinition) {
  if (field.control === 'input') {
    return false;
  }

  if (field.control === 'textarea') {
    return true;
  }

  if (typeof field.multiline === 'boolean') {
    return field.multiline;
  }

  if (field.key === 'width' || field.key === 'height') {
    return false;
  }

  return Boolean(field.presets?.length) || field.key.toLowerCase().includes('prompt');
}

function resolveFormCardClassName(fields: AppFieldDefinition[]) {
  if (fields.some((field) => field.type === 'file')) {
    return 'workspace-form-card workspace-form-card-upload';
  }

  if (fields.some((field) => useMultilineField(field) || field.key.toLowerCase().includes('prompt'))) {
    return 'workspace-form-card workspace-form-card-prompt';
  }

  return 'workspace-form-card workspace-form-card-secondary';
}

export function DynamicAppForm({
  app,
  value,
  onChange,
  fields,
  title,
  eyebrow,
  description,
}: DynamicAppFormProps) {
  const formId = useId();
  const renderedFields = fields ?? app.fields ?? [];
  const cardClassName = resolveFormCardClassName(renderedFields);

  function updateField(key: string, nextValue: DynamicFormValue) {
    onChange({
      ...value,
      [key]: nextValue,
    });
  }

  return (
    <AcrylicCard
      eyebrow={eyebrow ?? 'Input'}
      title={title ?? `${app.shortTitle} 参数`}
      className={cardClassName}
    >
      {description ? <p className="muted-text">{description}</p> : null}
      <div className="form-stack">
        {renderedFields.map((field, index) => {
          if (field.type === 'file') {
            return (
              <FileDropZone
                key={field.key}
                label={field.label}
                hint={field.description}
                file={readFileValue(value[field.key])}
                accept={field.accept}
                onChange={(file) => updateField(field.key, file)}
              />
            );
          }

          if (field.type === 'boolean') {
            return (
              <label key={field.key} className="toggle-field">
                <span className="toggle-copy">
                  <strong>{field.label}</strong>
                  <small>{field.description}</small>
                </span>
                <span className="toggle-control">
                  <input
                    aria-label={buildBooleanAriaLabel(app, field.key, field.label)}
                    type="checkbox"
                    checked={readBooleanValue(value[field.key])}
                    onChange={(event) => updateField(field.key, event.target.checked)}
                  />
                  <span className="toggle-slider" />
                </span>
              </label>
            );
          }

          const inputId = `${formId}-${index}-${field.key}`;

          return (
            <div key={field.key} className="form-stack">
              {useMultilineField(field) ? (
                <label className="field-stack" htmlFor={inputId}>
                  <span>{field.label}</span>
                  <textarea
                    id={inputId}
                    className="fluent-textarea"
                    value={readTextValue(value[field.key])}
                    rows={field.rows ?? 5}
                    placeholder={field.placeholder ?? field.description}
                    onChange={(event) => updateField(field.key, event.target.value)}
                  />
                </label>
              ) : (
                <label className="field-stack" htmlFor={inputId}>
                  <span>{field.label}</span>
                  <input
                    id={inputId}
                    className="fluent-input"
                    type="text"
                    value={readTextValue(value[field.key])}
                    placeholder={field.placeholder ?? field.description}
                    onChange={(event) => updateField(field.key, event.target.value)}
                  />
                </label>
              )}
              {field.presets && field.presets.length > 0 ? (
                <div className="preset-row">
                  {field.presets.map((preset) => (
                    <button
                      key={preset}
                      className="glass-chip is-button"
                      type="button"
                      onClick={() => updateField(field.key, preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </AcrylicCard>
  );
}
