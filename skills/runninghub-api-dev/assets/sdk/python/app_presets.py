#!/usr/bin/env python3
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


APP_API_DIR = Path(__file__).resolve().parents[2] / "app-source-pages"


@dataclass(frozen=True)
class AppPreset:
    app_id: str
    title: str
    input_keys: tuple[str, ...]
    prompt_key: str | None
    static_overrides: dict[str, Any]
    recommended_prompt: str | None


APP_PRESETS: dict[str, AppPreset] = {
    "1994388299756212225": AppPreset(
        app_id="1994388299756212225",
        title="室内设计平面图填色-立体版",
        input_keys=("257:image",),
        prompt_key="253:text",
        static_overrides={"260:width": "1600", "260:height": "1600"},
        recommended_prompt=(
            "Convert the 2D floor plan into a clean 3D interior render with realistic "
            "lighting, soft shadows, warm wood flooring, light gray walls, and keep the "
            "original room layout and furniture positions unchanged."
        ),
    ),
    "1986819253754130433": AppPreset(
        app_id="1986819253754130433",
        title="Missa_建筑景观_风格迁移_效果图专用",
        input_keys=("1:image", "403:image"),
        prompt_key=None,
        static_overrides={},
        recommended_prompt=None,
    ),
    "2003678561775067138": AppPreset(
        app_id="2003678561775067138",
        title="🍌香蕉  2 & Pro9图任意融合",
        input_keys=(
            "3:image",
            "7:image",
            "8:image",
            "11:image",
            "12:image",
            "13:image",
            "14:image",
            "15:image",
            "18:image",
        ),
        prompt_key="2:prompt",
        static_overrides={},
        recommended_prompt=(
            "根据第一张户型平面图生成写实室内效果图，保留空间布局与视角关系，"
            "并融合其余参考图中的沙发、吊顶、电视墙、灯具、窗户、地板、背景墙和绿植风格。"
        ),
    ),
    "2023563076041183233": AppPreset(
        app_id="2023563076041183233",
        title="毛坯房出图-全能版",
        input_keys=("541:image", "538:image"),
        prompt_key="558:text",
        static_overrides={
            "605:aspectRatio": "auto",
            "605:resolution": "2k",
            "605:channel": "Third-party",
        },
        recommended_prompt="现代奶油风客厅，保留原始空间结构，左侧电视背景墙，右侧沙发，写实软装效果。",
    ),
}


def load_demo_json(app_id: str) -> dict[str, Any]:
    path = APP_API_DIR / f"{app_id}-api-demo.json"
    return json.loads(path.read_text(encoding="utf-8"))


def build_app_overrides(
    app_id: str,
    *,
    uploaded_assets: list[str],
    prompt: str | None = None,
) -> dict[str, Any]:
    preset = APP_PRESETS[app_id]
    if len(uploaded_assets) < len(preset.input_keys):
        raise ValueError(
            f"{preset.title} 需要至少 {len(preset.input_keys)} 个资源，当前仅提供 {len(uploaded_assets)} 个。"
        )

    overrides = dict(preset.static_overrides)
    for key, uploaded_name in zip(preset.input_keys, uploaded_assets, strict=True):
        overrides[key] = uploaded_name

    if preset.prompt_key:
        overrides[preset.prompt_key] = prompt or preset.recommended_prompt or ""
    return overrides


def list_supported_app_ids() -> list[str]:
    return list(APP_PRESETS.keys())
