#!/usr/bin/env python3
"""抓取 RunningHub 官方页面并生成本地 references。

主要产物：
- references/docs/*.md
- references/endpoints/*.md
- references/schemas/*.md
- references/models/*.md
- references/10-api-index.md
- references/11-api-matrix.md
- assets/generated/inventory.json
- assets/source-cache/*.md
"""

from __future__ import annotations

import json
import re
import textwrap
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import yaml

import build_inventory


SKILL_ROOT = Path(__file__).resolve().parents[2]
REFERENCES_DIR = SKILL_ROOT / "references"
ASSETS_DIR = SKILL_ROOT / "assets"
GENERATED_DIR = ASSETS_DIR / "generated"
CACHE_DIR = ASSETS_DIR / "source-cache"
DOCS_DIR = REFERENCES_DIR / "docs"
ENDPOINTS_DIR = REFERENCES_DIR / "endpoints"
SCHEMAS_DIR = REFERENCES_DIR / "schemas"
MODELS_DIR = REFERENCES_DIR / "models"
INDEX_FILE = REFERENCES_DIR / "10-api-index.md"
MATRIX_FILE = REFERENCES_DIR / "11-api-matrix.md"

YAML_BLOCK_PATTERN = re.compile(r"```yaml\s*(.*?)```", re.DOTALL)
HEADING_PATTERN = re.compile(r"^(#{1,6})\s+(.*)$", re.MULTILINE)
UNSAFE_FILE_CHARS = re.compile(r"[\\/:*?\"<>|]+")
PAGE_ID_PATTERN = re.compile(r"(api|doc|schema)-(\d+)")

VERIFIED_PAGE_IDS = {
    "276613255": "账户接口已成功返回 code=0",
    "402615348": "上传接口已成功返回 code=0 和 fileName",
    "276613252": "状态查询已验证 301 与 807 错误场景",
}

MODEL_FILE_MAP = {
    "标准模型 API > 视频生成 > 海螺AI": "video-hailuo.md",
    "标准模型 API > 视频生成 > 全能视频 S": "video-quanneng-s.md",
    "标准模型 API > 视频生成 > 全能视频 V": "video-quanneng-v.md",
    "标准模型 API > 视频生成 > 可灵 2.5": "video-keling-25.md",
    "标准模型 API > 视频生成 > 可灵 2.6": "video-keling-26.md",
    "标准模型 API > 视频生成 > 可灵 o1": "video-keling-o1.md",
    "标准模型 API > 视频生成 > 万象 2.6": "video-wanxiang-26.md",
    "标准模型 API > 视频生成 > Vidu": "video-vidu.md",
    "标准模型 API > 图片生成 > 全能图片": "image-quanneng.md",
    "标准模型 API > 图片生成 > 全能图片 G": "image-quanneng-g.md",
    "标准模型 API > 图片生成 > seedream": "image-seedream.md",
}


def ensure_dirs() -> None:
    for directory in [
        REFERENCES_DIR,
        ASSETS_DIR,
        GENERATED_DIR,
        CACHE_DIR,
        DOCS_DIR,
        ENDPOINTS_DIR,
        SCHEMAS_DIR,
        MODELS_DIR,
    ]:
        directory.mkdir(parents=True, exist_ok=True)


def fetch_text(url: str) -> str:
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read().decode("utf-8", "replace")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def extract_yaml_block(markdown_text: str) -> Optional[str]:
    match = YAML_BLOCK_PATTERN.search(markdown_text)
    if not match:
        return None
    return match.group(1).strip()


def load_spec(markdown_text: str) -> Optional[dict]:
    yaml_block = extract_yaml_block(markdown_text)
    if not yaml_block:
        return None
    try:
        return yaml.safe_load(yaml_block)
    except yaml.YAMLError:
        return None


def sanitize_filename(text: str, page_id: str) -> str:
    cleaned = UNSAFE_FILE_CHARS.sub("-", text).strip().replace(" ", "-")
    cleaned = re.sub(r"-{2,}", "-", cleaned).strip("-")
    if not cleaned:
        cleaned = page_id
    if len(cleaned) > 48:
        cleaned = cleaned[:48].rstrip("-")
    return f"{page_id}-{cleaned}.md"


def page_local_path(item: dict) -> Path:
    filename = sanitize_filename(item["title"], item["page_id"])
    if item["type"] == "doc":
        return DOCS_DIR / filename
    if item["type"] == "api":
        return ENDPOINTS_DIR / filename
    if item["type"] == "schema":
        return SCHEMAS_DIR / filename
    return REFERENCES_DIR / "misc" / filename


def shorten(value: str, limit: int = 100) -> str:
    value = " ".join(value.split())
    if len(value) <= limit:
        return value
    return value[: limit - 1].rstrip() + "…"


def render_json(value: Any) -> str:
    if value is None:
        return "```json\nnull\n```"
    return "```json\n" + json.dumps(value, ensure_ascii=False, indent=2) + "\n```"


def extract_headings(markdown_text: str) -> List[str]:
    return [match.group(2).strip() for match in HEADING_PATTERN.finditer(markdown_text)]


def choose_example(content_node: Optional[dict]) -> Any:
    if not content_node:
        return None
    for media_type in content_node.values():
        if not isinstance(media_type, dict):
            continue
        if "example" in media_type:
            return media_type["example"]
        examples = media_type.get("examples")
        if isinstance(examples, dict):
            for example in examples.values():
                if isinstance(example, dict) and "value" in example:
                    return example["value"]
                return example
    return None


def extract_first_operation(spec: dict) -> Tuple[Optional[str], Optional[str], Optional[dict]]:
    paths = spec.get("paths") or {}
    for path, methods in paths.items():
        if not isinstance(methods, dict):
            continue
        for method, operation in methods.items():
            if isinstance(operation, dict):
                return path, method.upper(), operation
    return None, None, None


def format_parameters(parameters: Iterable[dict], location: str) -> str:
    picked = [param for param in parameters if isinstance(param, dict) and param.get("in") == location]
    if not picked:
        return "- [官网明确] 未在该页面显式列出此类参数。"

    lines: List[str] = []
    for param in picked:
        name = param.get("name", "")
        required = "是" if param.get("required") else "否"
        example = param.get("example")
        description = param.get("description") or ""
        schema = param.get("schema") or {}
        param_type = schema.get("type", "未说明")
        extra = f"，示例：`{example}`" if example not in (None, "") else ""
        lines.append(
            f"- [官网明确] `{name}`：位置 `{location}`，类型 `{param_type}`，必填 `{required}`{extra}。{description}"
        )
    return "\n".join(lines)


def summarize_schema(schema: Any, level: int = 0, max_depth: int = 2) -> List[str]:
    if not isinstance(schema, dict):
        return []

    indent = "  " * level
    lines: List[str] = []
    properties = schema.get("properties")
    required_fields = set(schema.get("required") or [])
    if isinstance(properties, dict):
        for name, node in properties.items():
            if not isinstance(node, dict):
                lines.append(f"{indent}- `{name}`：结构未展开。")
                continue
            field_type = node.get("type", "未说明")
            required = "必填" if name in required_fields else "可选"
            description = node.get("description") or ""
            lines.append(f"{indent}- `{name}`：`{field_type}`，{required}。{description}".rstrip())
            if level < max_depth and node.get("properties"):
                lines.extend(summarize_schema(node, level + 1, max_depth=max_depth))
    return lines


def build_doc_page(item: dict, page_text: str) -> str:
    headings = extract_headings(page_text)
    outline = "\n".join(f"- `{heading}`" for heading in headings[:20]) if headings else "- 未检测到二级标题。"
    return textwrap.dedent(
        f"""\
        # {item['title']}

        - 类型：官方说明页
        - 页面 ID：`doc-{item['page_id']}`
        - 官方地址：{item['url']}
        - 官方分类：`{item['category']}`
        - 覆盖状态：[官网明确] 已归档到本地

        ## 页面摘要

        - [官网明确] {item['summary'] or '该页面未在 llms.txt 中提供附加摘要。'}

        ## 目录提要

        {outline}

        ## 本地使用建议

        - [交叉整理] 说明页通常用于理解概念、接入顺序、参数来源与排障思路。
        - [交叉整理] 若你正在写代码，建议优先结合 `references/10-api-index.md` 与对应接口页一起读。

        ## 官网原文归档

        {page_text.strip()}
        """
    )


def build_schema_page(item: dict, page_text: str, spec: Optional[dict]) -> str:
    lines = [
        f"# {item['title']}",
        "",
        f"- 类型：官方 Schema 页",
        f"- 页面 ID：`schema-{item['page_id']}`",
        f"- 官方地址：{item['url']}",
        f"- 官方分类：`{item['category']}`",
        "- 覆盖状态：[官网明确] 已归档到本地",
        "",
        "## 结构摘要",
        "",
    ]

    if spec:
        schemas = ((spec.get("components") or {}).get("schemas") or {})
        if schemas:
            for schema_name, schema_body in schemas.items():
                lines.append(f"### {schema_name}")
                summary_lines = summarize_schema(schema_body)
                if summary_lines:
                    lines.extend(summary_lines)
                else:
                    lines.append("- [官网明确] 该 schema 未在页面中展开属性。")
                lines.append("")
        else:
            lines.append("- [官网明确] 页面存在 OpenAPI 结构，但未检测到 components.schemas。")
            lines.append("")
    else:
        lines.append("- [官网明确] 页面未解析出可结构化的 OpenAPI schema。")
        lines.append("")

    lines.extend(
        [
            "## 官网原文归档",
            "",
            page_text.strip(),
        ]
    )
    return "\n".join(lines)


def build_api_page(item: dict, page_text: str, spec: Optional[dict]) -> str:
    path = None
    method = None
    operation = None
    if spec:
        path, method, operation = extract_first_operation(spec)

    lines = [
        f"# {item['title']}",
        "",
        f"- 类型：官方 API 页",
        f"- 页面 ID：`api-{item['page_id']}`",
        f"- 官方地址：{item['url']}",
        f"- 官方分类：`{item['category']}`",
        "- 覆盖状态：[官网明确] 已归档到本地",
    ]
    if item["page_id"] in VERIFIED_PAGE_IDS:
        lines.append(f"- 实测状态：[真实验证] {VERIFIED_PAGE_IDS[item['page_id']]}")
    lines.append("")

    lines.extend(["## 接口摘要", ""])
    if path and method and operation:
        description = operation.get("description") or operation.get("summary") or item["summary"] or "未提供。"
        tags = operation.get("tags") or []
        tag_text = "、".join(tags) if tags else "未标注"
        lines.append(f"- [官网明确] 方法：`{method}`")
        lines.append(f"- [官网明确] 路径：`{path}`")
        lines.append(f"- [官网明确] 标签：{tag_text}")
        lines.append(f"- [官网明确] 说明：{shorten(description, 240)}")
    else:
        lines.append("- [官网明确] 该页面未成功解析出路径与方法，请回看官网原文归档。")
    lines.append("")

    lines.extend(["## 请求头", "", format_parameters((operation or {}).get("parameters") or [], "header"), ""])
    lines.extend(["## Query 参数", "", format_parameters((operation or {}).get("parameters") or [], "query"), ""])

    request_example = choose_example(((operation or {}).get("requestBody") or {}).get("content"))
    lines.extend(["## 请求体示例", ""])
    if request_example is None:
        lines.append("- [官网明确] 该页面未提供可直接抽取的请求体示例。")
    else:
        lines.append(render_json(request_example))
    lines.append("")

    response_example = None
    if operation:
        responses = operation.get("responses") or {}
        for response_node in responses.values():
            if not isinstance(response_node, dict):
                continue
            response_example = choose_example(response_node.get("content"))
            if response_example is not None:
                break
    lines.extend(["## 响应示例", ""])
    if response_example is None:
        lines.append("- [官网明确] 该页面未提供可直接抽取的响应示例。")
    else:
        lines.append(render_json(response_example))
    lines.append("")

    lines.extend(["## 开发提示", ""])
    if path:
        lines.append("- [交叉整理] 先确认此接口属于哪条接入主线：工作流、快捷创作、标准模型、上传或任务查询。")
        lines.append(f"- [交叉整理] 若你是从矩阵跳转到此页，回看 `references/11-api-matrix.md` 可找到相关本地章节。")
    if item["page_id"] in VERIFIED_PAGE_IDS:
        lines.append(f"- [真实验证] {VERIFIED_PAGE_IDS[item['page_id']]}")
    else:
        lines.append("- [推断建议] 若这是高价值接口，后续可用真实 API Key 做最小化验证并追加到 `12-verified-findings.md`。")
    lines.append("")

    lines.extend(["## 官网原文归档", "", page_text.strip()])
    return "\n".join(lines)


def render_index(items: List[dict], local_paths: Dict[str, Path]) -> str:
    counts = Counter(item["type"] for item in items)
    category_groups: Dict[str, List[dict]] = defaultdict(list)
    for item in items:
        category_groups[item["category"]].append(item)

    lines = [
        "# RunningHub 官方页面总索引",
        "",
        "- [交叉整理] 本页是官网 `llms.txt` 的本地索引视图，用于确保零漏页覆盖。",
        f"- [官网明确] 总页面数：`{len(items)}`",
        f"- [官网明确] API 页：`{counts.get('api', 0)}`",
        f"- [官网明确] 说明页：`{counts.get('doc', 0)}`",
        f"- [官网明确] Schema 页：`{counts.get('schema', 0)}`",
        "",
        "## 按类型查看",
        "",
    ]

    for item_type, label in [("doc", "说明页"), ("api", "接口页"), ("schema", "Schema 页")]:
        lines.append(f"### {label}")
        typed_items = [item for item in items if item["type"] == item_type]
        if not typed_items:
            lines.append("- 无")
            lines.append("")
            continue
        for item in typed_items:
            rel_path = local_paths[item["page_id"]].relative_to(SKILL_ROOT)
            lines.append(f"- `{item_type}-{item['page_id']}` [{item['title']}]({item['url']}) → `{rel_path}`")
        lines.append("")

    lines.extend(["## 按官方分类查看", ""])
    for category in sorted(category_groups):
        lines.append(f"### {category}")
        for item in category_groups[category]:
            rel_path = local_paths[item["page_id"]].relative_to(SKILL_ROOT)
            verified = "，已实测" if item["page_id"] in VERIFIED_PAGE_IDS else ""
            lines.append(f"- `{item['type']}-{item['page_id']}` {item['title']} → `{rel_path}`{verified}")
        lines.append("")

    return "\n".join(lines)


def render_matrix(items: List[dict], local_paths: Dict[str, Path]) -> str:
    lines = [
        "# RunningHub 覆盖矩阵",
        "",
        "- [交叉整理] 本页用于检查官网所有页面是否都已在本地 Skill 中有归宿。",
        "",
        "| 类型 | 页面 ID | 标题 | 本地文件 | 覆盖 | 实测 | 备注 |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]

    for item in items:
        rel_path = local_paths[item["page_id"]].relative_to(SKILL_ROOT)
        covered = "已覆盖"
        verified = "是" if item["page_id"] in VERIFIED_PAGE_IDS else "否"
        note = VERIFIED_PAGE_IDS.get(item["page_id"], item["summary"] or "已归档")
        lines.append(
            f"| {item['type']} | {item['page_id']} | {item['title']} | `{rel_path}` | {covered} | {verified} | {shorten(note, 40)} |"
        )

    return "\n".join(lines)


def render_model_guides(items: List[dict], local_paths: Dict[str, Path], api_specs: Dict[str, Optional[dict]]) -> None:
    grouped: Dict[str, List[dict]] = defaultdict(list)
    for item in items:
        if item["type"] != "api":
            continue
        if item["category"] in MODEL_FILE_MAP:
            grouped[item["category"]].append(item)

    for category, filename in MODEL_FILE_MAP.items():
        members = sorted(grouped.get(category, []), key=lambda value: int(value["page_id"]))
        lines = [
            f"# {category.split('>')[-1].strip()}",
            "",
            f"- [官网明确] 官方分类：`{category}`",
            f"- [交叉整理] 本页用于聚合该模型族全部官方接口，避免在官网多页之间来回跳转。",
            "",
            "## 已收录接口",
            "",
        ]
        if not members:
            lines.append("- [官网明确] 当前 `llms.txt` 中未发现该模型族的页面。")
            lines.append("")
        else:
            for member in members:
                rel_path = local_paths[member["page_id"]].relative_to(SKILL_ROOT)
                spec = api_specs.get(member["page_id"])
                path, method, _ = extract_first_operation(spec or {})
                extra = f"（`{method} {path}`）" if path and method else ""
                lines.append(f"- [官网明确] `{member['title']}` {extra} → `{rel_path}`")
            lines.append("")

        if members:
            request_keys = set()
            for member in members:
                spec = api_specs.get(member["page_id"])
                _, _, operation = extract_first_operation(spec or {})
                if not operation:
                    continue
                content = ((operation.get("requestBody") or {}).get("content") or {})
                for media_type in content.values():
                    schema = media_type.get("schema") if isinstance(media_type, dict) else None
                    if isinstance(schema, dict):
                        for key in (schema.get("properties") or {}).keys():
                            request_keys.add(key)
            lines.extend(["## 参数观察", ""])
            if request_keys:
                for key in sorted(request_keys):
                    lines.append(f"- [交叉整理] 该模型族页面中出现过请求字段 `{key}`。")
            else:
                lines.append("- [官网明确] 当前页面中未能稳定抽取到统一的请求字段集合。")
            lines.append("")

        lines.extend(
            [
                "## 接入建议",
                "",
                "- [交叉整理] 先从本页定位具体接口，再跳到对应的 `references/endpoints/*.md` 看请求与响应示例。",
                "- [推断建议] 若你要实际接入某个模型族，请优先挑一个最低成本端点做最小联调，不必一开始就验证全部变体。",
                "",
            ]
        )

        write_text(MODELS_DIR / filename, "\n".join(lines))


def main() -> int:
    ensure_dirs()

    llms_text = build_inventory.fetch_llms_text()
    inventory_objects = build_inventory.parse_inventory(llms_text)
    items = build_inventory.inventory_to_dicts(inventory_objects)
    write_text(GENERATED_DIR / "inventory.json", json.dumps(items, ensure_ascii=False, indent=2))

    local_paths: Dict[str, Path] = {}
    api_specs: Dict[str, Optional[dict]] = {}

    for item in items:
        page_text = fetch_text(item["url"])
        cache_match = PAGE_ID_PATTERN.search(item["url"])
        cache_name = cache_match.group(0) + ".txt" if cache_match else f"{item['type']}-{item['page_id']}.txt"
        write_text(CACHE_DIR / cache_name, page_text)

        local_path = page_local_path(item)
        local_paths[item["page_id"]] = local_path
        spec = load_spec(page_text)

        if item["type"] == "doc":
            content = build_doc_page(item, page_text)
        elif item["type"] == "schema":
            content = build_schema_page(item, page_text, spec)
        else:
            content = build_api_page(item, page_text, spec)
            api_specs[item["page_id"]] = spec

        write_text(local_path, content)

    write_text(INDEX_FILE, render_index(items, local_paths))
    write_text(MATRIX_FILE, render_matrix(items, local_paths))
    render_model_guides(items, local_paths, api_specs)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
