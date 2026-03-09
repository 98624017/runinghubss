import { AcrylicCard } from '../../components/AcrylicCard';
import { DynamicAppForm } from '../apps/DynamicAppForm';
import type {
  AppDefinition,
  AppFieldDefinition,
  AppResultSection,
  AppSchemaSection,
  DynamicFormValues,
} from '../../types';

type SchemaRendererProps = {
  app: AppDefinition;
  value: DynamicFormValues;
  onChange: (nextValue: DynamicFormValues) => void;
  resultNotice?: string;
};

type FieldGroup = AppSchemaSection & {
  fields: AppFieldDefinition[];
};

function getLayoutSections(app: AppDefinition): AppSchemaSection[] {
  const configuredSections = Array.isArray(app.layoutSchema?.sections) ? app.layoutSchema.sections : [];
  if (configuredSections.length > 0) {
    return configuredSections;
  }

  const derivedKeys = Array.from(
    new Set(
      (app.fields ?? [])
        .map((field) => field.sectionKey || field.group)
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0),
    ),
  );

  if (derivedKeys.length > 0) {
    return derivedKeys.map((key) => ({
      key,
      title: key,
    }));
  }

  return [{ key: 'default', title: '参数设置' }];
}

function pickSectionKey(field: AppFieldDefinition, sections: AppSchemaSection[]) {
  if (field.sectionKey) {
    return field.sectionKey;
  }

  if (field.group) {
    return field.group;
  }

  if (sections.length <= 1) {
    return sections[0]?.key ?? 'default';
  }

  return field.type === 'file' ? sections[0].key : sections[1]?.key ?? sections[0].key;
}

// 这里优先尊重后台 schema 的分组键；若后台暂未完整配置，
// 就回退到默认分区，保证工作区仍然能正常提交。
export function buildGroupedSections(app: AppDefinition): FieldGroup[] {
  const sections = getLayoutSections(app);
  const groups = new Map<string, AppFieldDefinition[]>();

  for (const field of app.fields ?? []) {
    const sectionKey = pickSectionKey(field, sections);
    const currentFields = groups.get(sectionKey) ?? [];
    currentFields.push(field);
    groups.set(sectionKey, currentFields);
  }

  return sections
    .map((section) => ({
      ...section,
      fields: groups.get(section.key) ?? [],
    }))
    .filter((section) => section.fields.length > 0);
}

function getResultSections(app: AppDefinition): AppResultSection[] {
  const sections = Array.isArray(app.resultSchema?.sections) ? app.resultSchema.sections : [];
  if (sections.length > 0) {
    return sections;
  }

  if (app.notes.length === 0) {
    return [];
  }

  return [{ key: 'default-results', title: '结果说明', tips: app.notes }];
}

export function SchemaRenderer({ app, value, onChange, resultNotice }: SchemaRendererProps) {
  const sections = buildGroupedSections(app);
  const resultSections = getResultSections(app);
  const notes = [...app.notes];

  if (resultNotice && !notes.includes(resultNotice)) {
    notes.push(resultNotice);
  }

  return (
    <div className="workspace-form-stack">
      {sections.map((section) => (
        <DynamicAppForm
          key={section.key}
          app={app}
          fields={section.fields}
          value={value}
          onChange={onChange}
          title={section.title}
          description={section.description}
        />
      ))}

      {(resultSections.length > 0 || notes.length > 0) && (
        <section className="acrylic-card schema-section-card">
          <div className="schema-section-header">
            <h3>结果说明</h3>
          </div>
          <div className="schema-guide">
            {resultSections.map((section) => (
              <div key={section.key} className="schema-guide-section">
                <p className="schema-guide-title">{section.title}</p>
                {section.description ? <p className="muted-text">{section.description}</p> : null}
                {section.tips && section.tips.length > 0 ? (
                  <ul className="schema-guide-list">
                    {section.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}

            {notes.length > 0 ? (
              <ul className="schema-guide-list">
                {notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
