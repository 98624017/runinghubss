import { describe, expect, it } from 'vitest';

import {
  APPS,
  COLOR_PLAN_PROMPT_PRESETS,
  FLOORPLAN_RENDER_PROMPT_PRESETS,
  ROUGH_ROOM_PROMPT_PRESETS,
  getAppById,
} from './appsConfig';

describe('appsConfig', () => {
  it('应包含四个 fallback 应用', () => {
    expect(APPS).toHaveLength(4);
  });

  it('应能找到四个指定应用', () => {
    expect(getAppById('1994388299756212225').title).toBe('一键彩平');
    expect(getAppById('1986819253754130433').title).toBe('外观迁移');
    expect(getAppById('2003678561775067138').title).toBe('平面转效果');
    expect(getAppById('2023563076041183233').title).toBe('毛坯转效果');
  });

  it('应提供文本提示词预置', () => {
    expect(COLOR_PLAN_PROMPT_PRESETS.length).toBeGreaterThan(0);
    expect(FLOORPLAN_RENDER_PROMPT_PRESETS.length).toBeGreaterThan(0);
    expect(ROUGH_ROOM_PROMPT_PRESETS.length).toBeGreaterThan(0);
  });

  it('应给 fallback 应用补齐字段定义', () => {
    expect(APPS[0]?.fields?.[0]?.key).toBe('file');
    expect(APPS[1]?.fields?.[1]?.key).toBe('styleImage');
    expect(getAppById('1994388299756212225').fields?.map((field) => field.key)).toEqual([
      'file',
      'prompt',
      'width',
      'height',
    ]);
    expect(getAppById('1986819253754130433').fields?.map((field) => field.key)).toEqual([
      'sourceImage',
      'styleImage',
    ]);
    expect(getAppById('2003678561775067138').fields?.map((field) => field.key)).toEqual([
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
    expect(getAppById('2023563076041183233').fields?.map((field) => field.key)).toEqual([
      'sourceImage',
      'styleImage',
      'prompt',
      'aspectRatio',
      'resolution',
      'channel',
    ]);
  });

  it('应带上已验证的默认值', () => {
    const floorPlanApp = getAppById('1994388299756212225');
    const roughRenderApp = getAppById('2023563076041183233');

    expect(floorPlanApp.fields?.find((field) => field.key === 'prompt')?.defaultValue).toContain(
      'Convert the 2D floor plan into a detailed 3D colored plan',
    );
    expect(floorPlanApp.fields?.find((field) => field.key === 'width')?.defaultValue).toBe(
      '1600',
    );
    expect(floorPlanApp.fields?.find((field) => field.key === 'height')?.defaultValue).toBe(
      '1600',
    );
    expect(roughRenderApp.fields?.find((field) => field.key === 'aspectRatio')?.defaultValue).toBe(
      'auto',
    );
    expect(roughRenderApp.fields?.find((field) => field.key === 'resolution')?.defaultValue).toBe(
      '2k',
    );
  });
});
