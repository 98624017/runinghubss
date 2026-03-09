#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


def main() -> int:
    validation_dir = Path(__file__).resolve().parents[2] / "assets" / "validation"
    summary_path = validation_dir / "summary.json"

    entries: list[dict] = []
    app_ids: set[str] = set()
    by_app: dict[str, list[dict]] = {}
    for path in sorted(validation_dir.glob("app-*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        result = payload.get("result") or {}
        submit = result.get("submit") or {}
        final = result.get("final") or {}
        outputs = ((final.get("outputs") or {}).get("data")) or []
        entry = {
            "file": path.name,
            "sdk": payload.get("sdk"),
            "appId": payload.get("appId"),
            "taskId": ((submit.get("data") or {}).get("taskId")),
            "startedAt": payload.get("startedAt"),
            "finishedAt": payload.get("finishedAt"),
            "finalState": final.get("finalState"),
            "outputCount": len(outputs) if isinstance(outputs, list) else None,
        }
        entries.append(entry)
        app_id = str(payload.get("appId"))
        app_ids.add(app_id)
        by_app.setdefault(app_id, []).append(
            {
                "file": path.name,
                "sdk": payload.get("sdk"),
                "taskId": entry["taskId"],
                "finalState": entry["finalState"],
                "outputCount": entry["outputCount"],
            }
        )

    summary = {
        "runCount": len(entries),
        "distinctAppCount": len(app_ids),
        "coveredAppIds": sorted(app_ids),
        "runsByApp": by_app,
        "entries": entries,
    }
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
