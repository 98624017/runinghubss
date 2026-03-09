import { describe, expect, test } from 'vitest';

import { APPS } from './appsConfig';

describe('app forms config', () => {
  test('四个应用都带有字段定义，可供字段驱动表单直接渲染', () => {
    expect(APPS[0]?.fields?.map((field) => field.key)).toEqual(['file', 'prompt', 'width', 'height']);
    expect(APPS[0]?.fields?.[1]?.defaultValue).toBeTruthy();
    expect(APPS[1]?.fields?.map((field) => field.key)).toEqual(['sourceImage', 'styleImage']);
    expect(APPS[2]?.fields?.map((field) => field.key)).toEqual([
      'prompt',
      'planImage',
      'sofaReference',
      'ceilingReference',
      'tvWallReference',
      'chandelierReference',
      'windowReference',
      'floorReference',
      'wallReference',
      'plantReference',
    ]);
    expect(APPS[3]?.fields?.map((field) => field.key)).toEqual([
      'sourceImage',
      'styleImage',
      'prompt',
      'aspectRatio',
      'resolution',
      'channel',
    ]);
    expect(APPS[3]?.fields?.find((field) => field.key === 'resolution')?.defaultValue).toBe('2k');
  });
});
