import { describe, expect, it } from 'vitest';

import { getPromptPresets, getSupportedApp, listPublicSupportedApps, listSupportedApps } from './apps.js';

describe('apps config', () => {
  it('应暴露六个可执行应用与四个前台默认应用', () => {
    expect(listSupportedApps()).toHaveLength(6);
    expect(listPublicSupportedApps().map((app) => app.id)).toEqual([
      '1994388299756212225',
      '1986819253754130433',
      '2003678561775067138',
      '2023563076041183233',
    ]);
  });

  it('应正确映射高清放大应用的节点', () => {
    const app = getSupportedApp('2011111632956563457');
    const nodes = app.buildNodeInfoList({
      uploadedFiles: { file: 'openapi/demo.png' },
      formValues: { enable8k: true },
    });
    expect(nodes).toEqual([
      { nodeId: '308', fieldName: 'image', fieldValue: 'openapi/demo.png' },
      { nodeId: '306', fieldName: 'value', fieldValue: 'true' },
    ]);
  });

  it('应正确映射全能图片应用的节点', () => {
    const app = getSupportedApp('1993737411698032641');
    const nodes = app.buildNodeInfoList({
      uploadedFiles: { file: 'openapi/demo.png' },
      formValues: { prompt: '测试提示词' },
    });
    expect(nodes).toEqual([
      { nodeId: '22', fieldName: 'image', fieldValue: 'openapi/demo.png' },
      { nodeId: '43', fieldName: 'text', fieldValue: '测试提示词' },
    ]);
  });

  it('应正确映射室内设计平面图填色应用的节点', () => {
    const app = getSupportedApp('1994388299756212225');
    const nodes = app.buildNodeInfoList({
      uploadedFiles: { file: 'openapi/floorplan.jpg' },
      formValues: {
        prompt: '现代暖木色住宅效果图',
        width: '1600',
        height: '1600',
      },
    });

    expect(nodes).toEqual([
      { nodeId: '257', fieldName: 'image', fieldValue: 'openapi/floorplan.jpg' },
      { nodeId: '253', fieldName: 'text', fieldValue: '现代暖木色住宅效果图' },
      { nodeId: '260', fieldName: 'width', fieldValue: '1600' },
      { nodeId: '260', fieldName: 'height', fieldValue: '1600' },
    ]);
  });

  it('应正确映射双图风格迁移应用的节点', () => {
    const app = getSupportedApp('1986819253754130433');
    const nodes = app.buildNodeInfoList({
      uploadedFiles: {
        sourceImage: 'openapi/original.png',
        styleImage: 'openapi/style.png',
      },
      formValues: {},
    });

    expect(nodes).toEqual([
      { nodeId: '1', fieldName: 'image', fieldValue: 'openapi/original.png' },
      { nodeId: '403', fieldName: 'image', fieldValue: 'openapi/style.png' },
    ]);
  });

  it('应正确映射平面转效果应用的节点', () => {
    const app = getSupportedApp('2003678561775067138');
    const nodes = app.buildNodeInfoList({
      uploadedFiles: {
        planImage: 'openapi/plan.png',
        sofaReference: 'openapi/sofa.png',
        ceilingReference: 'openapi/ceiling.png',
        tvWallReference: 'openapi/tv-wall.png',
        chandelierReference: 'openapi/light.png',
        windowReference: 'openapi/window.png',
        floorReference: 'openapi/floor.png',
        wallReference: 'openapi/wall.png',
        plantReference: 'openapi/plant.png',
      },
      formValues: {
        prompt: '根据平面图和参考图输出客厅写实效果图',
      },
    });

    expect(nodes).toEqual([
      { nodeId: '2', fieldName: 'prompt', fieldValue: '根据平面图和参考图输出客厅写实效果图' },
      { nodeId: '3', fieldName: 'image', fieldValue: 'openapi/plan.png' },
      { nodeId: '7', fieldName: 'image', fieldValue: 'openapi/sofa.png' },
      { nodeId: '8', fieldName: 'image', fieldValue: 'openapi/ceiling.png' },
      { nodeId: '11', fieldName: 'image', fieldValue: 'openapi/tv-wall.png' },
      { nodeId: '12', fieldName: 'image', fieldValue: 'openapi/light.png' },
      { nodeId: '13', fieldName: 'image', fieldValue: 'openapi/window.png' },
      { nodeId: '14', fieldName: 'image', fieldValue: 'openapi/floor.png' },
      { nodeId: '15', fieldName: 'image', fieldValue: 'openapi/wall.png' },
      { nodeId: '18', fieldName: 'image', fieldValue: 'openapi/plant.png' },
    ]);
  });

  it('应正确映射毛坯转效果应用的节点', () => {
    const app = getSupportedApp('2023563076041183233');
    const nodes = app.buildNodeInfoList({
      uploadedFiles: {
        sourceImage: 'openapi/raw-room.png',
        styleImage: 'openapi/style-room.png',
      },
      formValues: {
        prompt: '现代奶油风客厅',
        aspectRatio: '16:9',
        resolution: '4k',
        channel: 'Official',
      },
    });

    expect(nodes).toEqual([
      { nodeId: '541', fieldName: 'image', fieldValue: 'openapi/raw-room.png' },
      { nodeId: '538', fieldName: 'image', fieldValue: 'openapi/style-room.png' },
      { nodeId: '558', fieldName: 'text', fieldValue: '现代奶油风客厅' },
      { nodeId: '605', fieldName: 'aspectRatio', fieldValue: '16:9' },
      { nodeId: '605', fieldName: 'resolution', fieldValue: '4k' },
      { nodeId: '605', fieldName: 'channel', fieldValue: 'Official' },
    ]);
  });

  it('应提供文本提示词预置', () => {
    expect(getPromptPresets().length).toBeGreaterThan(0);
  });
});
