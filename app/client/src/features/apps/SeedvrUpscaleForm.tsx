import { AcrylicCard } from '../../components/AcrylicCard';
import { FileDropZone } from '../../components/FileDropZone';
import type { SeedvrFormValue } from '../../types';

type SeedvrUpscaleFormProps = {
  value: SeedvrFormValue;
  presets: string[];
  onChange: (nextValue: SeedvrFormValue) => void;
};

export function SeedvrUpscaleForm({
  value,
  presets,
  onChange,
}: SeedvrUpscaleFormProps) {
  return (
    <AcrylicCard eyebrow="Input" title="全能图片 Pro+ 参数">
      <div className="form-stack">
        <FileDropZone
          label="上传图片"
          hint="将图片映射到 22:image"
          file={value.file}
          accept="image/*"
          onChange={(file) => onChange({ ...value, file })}
        />
        <label className="field-stack" htmlFor="seedvr-prompt">
          <span>增强提示词</span>
          <textarea
            id="seedvr-prompt"
            className="fluent-textarea"
            value={value.prompt}
            rows={5}
            placeholder="输入你的图片增强提示词"
            onChange={(event) => onChange({ ...value, prompt: event.target.value })}
          />
        </label>
        <div className="preset-row">
          {presets.map((preset) => (
            <button
              key={preset}
              className="glass-chip is-button"
              type="button"
              onClick={() => onChange({ ...value, prompt: preset })}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </AcrylicCard>
  );
}
