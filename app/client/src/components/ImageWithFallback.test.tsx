import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ImageWithFallback } from './ImageWithFallback';

describe('ImageWithFallback', () => {
  it('应在图片加载失败时切换到占位图', () => {
    render(
      <ImageWithFallback
        src="https://example.com/broken-reference.png"
        fallbackSrc="/customer-brief/reference-fallback.svg"
        alt="客户参考图"
      />,
    );

    const image = screen.getByAltText('客户参考图') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('https://example.com/broken-reference.png');

    fireEvent.error(image);

    expect(image.getAttribute('src')).toBe('/customer-brief/reference-fallback.svg');
  });
});
