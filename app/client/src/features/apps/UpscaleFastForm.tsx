import { AcrylicCard } from '../../components/AcrylicCard';
import { FileDropZone } from '../../components/FileDropZone';
import type { UpscaleFastFormValue } from '../../types';

type UpscaleFastFormProps = {
  value: UpscaleFastFormValue;
  onChange: (nextValue: UpscaleFastFormValue) => void;
};

export function UpscaleFastForm({ value, onChange }: UpscaleFastFormProps) {
  return (
    <AcrylicCard eyebrow="Input" title="高清放大参数">
      <div className="form-stack">
        <FileDropZone
          label="上传图片"
          hint="将图片映射到 308:image"
          file={value.file}
          accept="image/*"
          onChange={(file) => onChange({ ...value, file })}
        />
        <label className="toggle-field">
          <span className="toggle-copy">
            <strong>开启 8K</strong>
            <small>关闭时默认 4K，打开后尝试 8K 放大。</small>
          </span>
          <span className="toggle-control">
            <input
              aria-label="开启8K，默认4K"
              type="checkbox"
              checked={value.enable8k}
              onChange={(event) =>
                onChange({
                  ...value,
                  enable8k: event.target.checked,
                })
              }
            />
            <span className="toggle-slider" />
          </span>
        </label>
      </div>
    </AcrylicCard>
  );
}
