import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useState } from 'react';

type ImageWithFallbackProps = Omit<ComponentPropsWithoutRef<'img'>, 'src'> & {
  src?: string;
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK_SRC = '/customer-brief/reference-fallback.svg';

export function ImageWithFallback({
  src,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  alt,
  onError,
  ...restProps
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      {...restProps}
      src={currentSrc}
      alt={alt}
      onError={(event) => {
        onError?.(event);

        // 加载失败时只切到一次占位图，避免 fallback 自身异常时反复触发。
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
