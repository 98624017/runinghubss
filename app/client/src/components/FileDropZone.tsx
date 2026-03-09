import { useEffect, useId, useState } from 'react';

type FileDropZoneProps = {
  label: string;
  hint: string;
  file: File | null;
  accept?: string;
  onChange: (file: File | null) => void;
};

export function FileDropZone({
  label,
  hint,
  file,
  accept,
  onChange,
}: FileDropZoneProps) {
  const inputId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return (
    <div className="file-drop-zone">
      <div className="field-heading">
        <label htmlFor={inputId}>{label}</label>
        <span>{hint}</span>
      </div>
      <label htmlFor={inputId} className="file-drop-surface">
        <input
          id={inputId}
          className="sr-only"
          type="file"
          aria-label={label}
          accept={accept}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
        {previewUrl ? (
          <div className="file-drop-preview">
            <img src={previewUrl} alt={`${label}预览`} />
          </div>
        ) : null}
        <span className="file-drop-title">
          {file ? '已选择文件' : '拖拽图片到这里，或点击选择'}
        </span>
        <span className="file-drop-meta">
          {file ? `${file.name} · ${Math.round(file.size / 1024)} KB` : '支持常见图片格式'}
        </span>
      </label>
    </div>
  );
}
