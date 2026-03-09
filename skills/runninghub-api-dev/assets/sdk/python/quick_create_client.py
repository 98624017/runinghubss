#!/usr/bin/env python3
from __future__ import annotations

import copy
import time
from dataclasses import dataclass
from typing import Any

from runninghub_client import RunningHubApiError, RunningHubClient


@dataclass
class RunningHubTaskFailure(Exception):
    """任务执行失败时抛出的异常。"""

    task_id: str
    response: dict[str, Any]

    def __str__(self) -> str:
        code = self.response.get("code")
        msg = self.response.get("msg") or self.response.get("message")
        return f"任务 {self.task_id} 执行失败 | code={code} msg={msg}"


def node_lookup_key(node: dict[str, Any]) -> str:
    return f"{node.get('nodeId')}:{node.get('fieldName')}"


def clone_nodes(node_info_list: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return copy.deepcopy(node_info_list)


def apply_node_overrides(
    node_info_list: list[dict[str, Any]],
    overrides: dict[str, Any],
) -> list[dict[str, Any]]:
    """按 `nodeId:fieldName` 键覆盖 demo 节点值。"""

    nodes = clone_nodes(node_info_list)
    index = {node_lookup_key(node): node for node in nodes}
    missing_keys: list[str] = []

    for key, value in overrides.items():
        target = index.get(key)
        if target is None:
            missing_keys.append(key)
            continue
        target["fieldValue"] = value

    if missing_keys:
        raise KeyError(f"未找到这些节点键：{', '.join(missing_keys)}")
    return nodes


class AiAppRunner:
    """基于 AI 应用 demo 的任务编排器。"""

    def __init__(self, client: RunningHubClient) -> None:
        self.client = client

    def get_demo_nodes(self, webapp_id: str | int) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        demo = self.client.get_ai_app_demo(webapp_id)
        data = demo.get("data") or {}
        node_info_list = data.get("nodeInfoList") or []
        if not node_info_list:
            raise RunningHubApiError("AI 应用 demo 未返回 nodeInfoList", response=demo)
        return demo, node_info_list

    def prepare_payload(
        self,
        webapp_id: str | int,
        *,
        node_overrides: dict[str, Any],
        instance_type: str | None = None,
        webhook_url: str | None = None,
    ) -> dict[str, Any]:
        demo, node_info_list = self.get_demo_nodes(webapp_id)
        nodes = apply_node_overrides(node_info_list, node_overrides)
        payload: dict[str, Any] = {
            "webappId": str(webapp_id),
            "apiKey": self.client.api_key,
            "nodeInfoList": nodes,
            "demo": demo,
        }
        if instance_type:
            payload["instanceType"] = instance_type
        if webhook_url:
            payload["webhookUrl"] = webhook_url
        return payload

    def submit_payload(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.client.run_ai_app(
            webapp_id=payload["webappId"],
            node_info_list=payload["nodeInfoList"],
            webhook_url=payload.get("webhookUrl"),
            instance_type=payload.get("instanceType"),
        )

    def wait_for_completion(
        self,
        task_id: str | int,
        *,
        poll_interval: int = 12,
        timeout_seconds: int = 1800,
    ) -> dict[str, Any]:
        deadline = time.time() + timeout_seconds
        task_id_str = str(task_id)
        last_status: dict[str, Any] | None = None
        last_outputs: dict[str, Any] | None = None

        while time.time() < deadline:
            last_status = self.client.query_status(task_id_str)
            last_outputs = self.client.query_outputs(task_id_str)

            output_code = last_outputs.get("code")
            if output_code == 0 and last_outputs.get("data"):
                return {
                    "taskId": task_id_str,
                    "status": last_status,
                    "outputs": last_outputs,
                    "finalState": "SUCCESS",
                }

            if output_code == 805:
                raise RunningHubTaskFailure(task_id=task_id_str, response=last_outputs)

            if output_code in (804, 813):
                time.sleep(poll_interval)
                continue

            # 兼容 V2 的结构化错误或其他未知状态。
            if output_code not in (0, 804, 805, 813):
                v2_payload = self.client.query_v2(task_id_str)
                if v2_payload.get("results"):
                    return {
                        "taskId": task_id_str,
                        "status": last_status,
                        "outputs": last_outputs,
                        "v2": v2_payload,
                        "finalState": "SUCCESS_V2",
                    }
                if v2_payload.get("errorCode") not in (None, "", "0"):
                    raise RunningHubTaskFailure(task_id=task_id_str, response=v2_payload)
                time.sleep(poll_interval)
                continue

        raise TimeoutError(
            f"任务 {task_id_str} 在 {timeout_seconds} 秒内未完成。"
            f" 最后状态：{last_status} / {last_outputs}"
        )

    def run_and_wait(
        self,
        webapp_id: str | int,
        *,
        node_overrides: dict[str, Any],
        poll_interval: int = 12,
        timeout_seconds: int = 1800,
        instance_type: str | None = None,
        webhook_url: str | None = None,
    ) -> dict[str, Any]:
        payload = self.prepare_payload(
            webapp_id,
            node_overrides=node_overrides,
            instance_type=instance_type,
            webhook_url=webhook_url,
        )
        submit_result = self.submit_payload(payload)
        if submit_result.get("code") != 0:
            raise RunningHubTaskFailure(
                task_id=str((submit_result.get("data") or {}).get("taskId", "unknown")),
                response=submit_result,
            )
        task_id = str((submit_result.get("data") or {}).get("taskId"))
        final_result = self.wait_for_completion(
            task_id,
            poll_interval=poll_interval,
            timeout_seconds=timeout_seconds,
        )
        return {
            "payload": payload,
            "submit": submit_result,
            "final": final_result,
        }
