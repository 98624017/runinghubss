import { AcrylicCard } from '../../components/AcrylicCard';
import type {
  AdminAppEditorValue,
  AppFieldDefinition,
  AppResultSchema,
  AppResultSection,
  AppSchemaSection,
} from '../../types';

export type AdminAppDraft = AdminAppEditorValue & {
  schemaVersion: number;
  timeoutSeconds: number;
  isPublished: boolean;
  layoutSchema: {
    sections: AppSchemaSection[];
  };
  fieldSchema: {
    fields: AppFieldDefinition[];
  };
  fields: AppFieldDefinition[];
  resultSchema: AppResultSchema;
};

type SchemaEditorProps = {
  value: AdminAppDraft;
  onChange: (nextValue: AdminAppDraft) => void;
};

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const nextItems = items.slice();
  const [currentItem] = nextItems.splice(index, 1);
  nextItems.splice(targetIndex, 0, currentItem);
  return nextItems;
}

function updateItem<T extends Record<string, unknown>>(items: T[], index: number, patch: Partial<T>) {
  return items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(value: string[] | undefined) {
  return Array.isArray(value) ? value.join('\n') : '';
}

export function createEmptyAdminAppDraft(): AdminAppDraft {
  const fields: AppFieldDefinition[] = [];
  return {
    slug: '',
    displayName: '',
    subtitle: '',
    description: '',
    coverImageUrl: '',
    tagsText: '',
    sortOrder: 0,
    isEnabled: true,
    usageTipsText: '',
    resultTipsText: '',
    upstreamAppId: '',
    instanceType: 'default',
    usePersonalQueue: false,
    pollIntervalMs: 3000,
    maxPollAttempts: 20,
    maxConcurrencyPerKey: 1,
    schemaVersion: 1,
    timeoutSeconds: 180,
    isPublished: true,
    layoutSchema: {
      sections: [
        { key: 'inputs', title: '输入区', description: '' },
        { key: 'settings', title: '参数设置', description: '' },
      ],
    },
    fieldSchema: {
      fields,
    },
    fields,
    resultSchema: {
      sections: [{ key: 'results', title: '结果说明', description: '' }],
    },
  };
}

export function SchemaEditor({ value, onChange }: SchemaEditorProps) {
  const sections = value.layoutSchema.sections ?? [];
  const fields = value.fieldSchema?.fields ?? value.fields ?? [];
  const resultSections = value.resultSchema.sections ?? [];

  function updateValue(patch: Partial<AdminAppDraft>) {
    onChange({
      ...value,
      ...patch,
    });
  }

  function updateFields(nextFields: AppFieldDefinition[]) {
    updateValue({
      fieldSchema: {
        fields: nextFields,
      },
      fields: nextFields,
    });
  }

  function getNumberInputValue(nextValue: number) {
    return nextValue > 0 ? nextValue : '';
  }

  return (
    <div className="page-stack">
      <AcrylicCard eyebrow="Runtime" title="总体策略">
        <div className="history-filter-grid">
          <label className="field-stack" htmlFor="schema-version">
            <span>Schema 版本</span>
            <input
              id="schema-version"
              className="fluent-input"
              type="number"
              min={1}
              value={getNumberInputValue(value.schemaVersion)}
              onChange={(event) =>
                updateValue({
                  schemaVersion: event.target.value === '' ? 0 : Number(event.target.value),
                })
              }
            />
          </label>

          <label className="field-stack" htmlFor="schema-timeout">
            <span>总体超时时间（秒）</span>
            <input
              id="schema-timeout"
              aria-label="总体超时时间（秒）"
              className="fluent-input"
              type="number"
              min={1}
              value={getNumberInputValue(value.timeoutSeconds)}
              onChange={(event) =>
                updateValue({
                  timeoutSeconds: event.target.value === '' ? 0 : Number(event.target.value),
                })
              }
            />
          </label>
        </div>

        <label className="toggle-field">
          <span className="toggle-copy">
            <strong>发布当前 schema</strong>
            <small>开启后会作为前台当前生效版本。</small>
          </span>
          <span className="toggle-control">
            <input
              aria-label="发布当前 schema"
              type="checkbox"
              checked={value.isPublished}
              onChange={(event) => updateValue({ isPublished: event.target.checked })}
            />
            <span className="toggle-slider" />
          </span>
        </label>
      </AcrylicCard>

      <AcrylicCard eyebrow="Sections" title="字段分组">
        <div className="button-row">
          <button
            type="button"
            className="button-link button-link-secondary"
            onClick={() =>
              updateValue({
                layoutSchema: {
                  sections: [
                    ...sections,
                    {
                      key: `section-${sections.length + 1}`,
                      title: `新分组 ${sections.length + 1}`,
                      description: '',
                    },
                  ],
                },
              })
            }
          >
            新增分组
          </button>
        </div>

        <div className="admin-schema-list">
          {sections.map((section, index) => (
            <section key={`${section.key}-${index}`} className="schema-section-card">
              <header className="schema-section-header">
                <h3>{section.title}</h3>
              </header>
              <div className="admin-form-grid">
                <label className="field-stack">
                  <span>分组 Key</span>
                  <input
                    className="fluent-input"
                    value={section.key}
                    onChange={(event) =>
                      updateValue({
                        layoutSchema: {
                          sections: updateItem(sections, index, { key: event.target.value }),
                        },
                      })
                    }
                  />
                </label>
                <label className="field-stack">
                  <span>分组标题</span>
                  <input
                    className="fluent-input"
                    value={section.title}
                    onChange={(event) =>
                      updateValue({
                        layoutSchema: {
                          sections: updateItem(sections, index, { title: event.target.value }),
                        },
                      })
                    }
                  />
                </label>
                <label className="field-stack admin-form-grid-full">
                  <span>分组说明</span>
                  <input
                    className="fluent-input"
                    value={section.description ?? ''}
                    onChange={(event) =>
                      updateValue({
                        layoutSchema: {
                          sections: updateItem(sections, index, { description: event.target.value }),
                        },
                      })
                    }
                  />
                </label>
              </div>
            </section>
          ))}
        </div>
      </AcrylicCard>

      <AcrylicCard eyebrow="Fields" title="字段配置">
        <div className="button-row">
          <button
            type="button"
            className="button-link button-link-secondary"
            onClick={() =>
              updateFields([
                ...fields,
                {
                  key: `field-${fields.length + 1}`,
                  label: `新字段 ${fields.length + 1}`,
                  type: 'text',
                  description: '',
                  required: false,
                  sectionKey: sections[0]?.key,
                },
              ])
            }
          >
            新增字段
          </button>
        </div>

        <div className="admin-schema-list">
          {fields.map((field, index) => (
            <article key={`${field.key}-${index}`} className="admin-field-card" data-testid="schema-field-card">
              <div className="schema-editor-actions">
                <button
                  type="button"
                  className="result-action-button"
                  aria-label={`上移-${field.label || field.key || `字段${index + 1}`}`}
                  onClick={() => updateFields(moveItem(fields, index, -1))}
                >
                  {`上移-${field.label || field.key || `字段${index + 1}`}`}
                </button>
                <button
                  type="button"
                  className="result-action-button"
                  aria-label={`下移-${field.label || field.key || `字段${index + 1}`}`}
                  onClick={() => updateFields(moveItem(fields, index, 1))}
                >
                  {`下移-${field.label || field.key || `字段${index + 1}`}`}
                </button>
              </div>

              <div className="admin-form-grid">
                <label className="field-stack">
                  <span>字段 Key</span>
                  <input
                    className="fluent-input"
                    value={field.key}
                    onChange={(event) =>
                      updateFields(updateItem(fields, index, { key: event.target.value }))
                    }
                  />
                </label>
                <label className="field-stack">
                  <span>字段名称</span>
                  <input
                    className="fluent-input"
                    value={field.label}
                    onChange={(event) =>
                      updateFields(updateItem(fields, index, { label: event.target.value }))
                    }
                  />
                </label>
                <label className="field-stack">
                  <span>所属分组</span>
                  <select
                    className="fluent-input"
                    value={field.sectionKey ?? ''}
                    onChange={(event) =>
                      updateFields(updateItem(fields, index, { sectionKey: event.target.value }))
                    }
                  >
                    <option value="">未分组</option>
                    {sections.map((section) => (
                      <option key={section.key} value={section.key}>
                        {section.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-stack">
                  <span>字段类型</span>
                  <select
                    className="fluent-input"
                    value={field.type}
                    onChange={(event) =>
                      updateFields(
                        updateItem(fields, index, {
                          type: event.target.value as AppFieldDefinition['type'],
                        }),
                      )
                    }
                  >
                    <option value="text">文本</option>
                    <option value="file">文件</option>
                    <option value="boolean">布尔</option>
                  </select>
                </label>
                <label className="field-stack admin-form-grid-full">
                  <span>字段说明</span>
                  <input
                    className="fluent-input"
                    value={field.description ?? ''}
                    onChange={(event) =>
                      updateFields(updateItem(fields, index, { description: event.target.value }))
                    }
                  />
                </label>
                <label className="field-stack">
                  <span>{`默认值-${field.label || field.key || `字段${index + 1}`}`}</span>
                  <input
                    aria-label={`默认值-${field.label || field.key || `字段${index + 1}`}`}
                    className="fluent-input"
                    value={typeof field.defaultValue === 'string' ? field.defaultValue : ''}
                    onChange={(event) =>
                      updateFields(updateItem(fields, index, { defaultValue: event.target.value }))
                    }
                  />
                </label>
                <label className="field-stack">
                  <span>占位文案</span>
                  <input
                    className="fluent-input"
                    value={field.placeholder ?? ''}
                    onChange={(event) =>
                      updateFields(updateItem(fields, index, { placeholder: event.target.value }))
                    }
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      </AcrylicCard>

      <AcrylicCard eyebrow="Results" title="结果说明">
        <div className="admin-schema-list">
          {resultSections.map((section, index) => (
            <section key={`${section.key}-${index}`} className="schema-section-card">
              <header className="schema-section-header">
                <h3>{section.title}</h3>
              </header>
              <div className="admin-form-grid">
                <label className="field-stack">
                  <span>结果说明 Key</span>
                  <input
                    className="fluent-input"
                    value={section.key}
                    onChange={(event) =>
                      updateValue({
                        resultSchema: {
                          sections: updateItem(resultSections, index, { key: event.target.value }),
                        },
                      })
                    }
                  />
                </label>
                <label className="field-stack">
                  <span>{`结果说明标题-${section.key}`}</span>
                  <input
                    className="fluent-input"
                    value={section.title}
                    onChange={(event) =>
                      updateValue({
                        resultSchema: {
                          sections: updateItem(resultSections, index, { title: event.target.value }),
                        },
                      })
                    }
                  />
                </label>
                <label className="field-stack admin-form-grid-full">
                  <span>{`结果说明描述-${section.key}`}</span>
                  <textarea
                    aria-label={`结果说明描述-${section.key}`}
                    className="fluent-textarea"
                    rows={3}
                    value={section.description ?? ''}
                    onChange={(event) =>
                      updateValue({
                        resultSchema: {
                          sections: updateItem(resultSections, index, {
                            description: event.target.value,
                          }),
                        },
                      })
                    }
                  />
                </label>
                <label className="field-stack admin-form-grid-full">
                  <span>{`结果提醒-${section.key}`}</span>
                  <textarea
                    className="fluent-textarea"
                    rows={3}
                    value={joinLines(section.tips)}
                    onChange={(event) =>
                      updateValue({
                        resultSchema: {
                          sections: updateItem(resultSections, index, {
                            tips: splitLines(event.target.value),
                          }),
                        },
                      })
                    }
                  />
                </label>
              </div>
            </section>
          ))}
        </div>
      </AcrylicCard>
    </div>
  );
}
