from __future__ import annotations

from dataclasses import dataclass
from html import unescape
from typing import Any, Iterable
from urllib.parse import quote
import json
import re

from .http import HttpRequestError, request_json


SKETCHFAB_UID_RE = re.compile(r"([0-9a-f]{32})", re.IGNORECASE)
HTML_TAG_RE = re.compile(r"<[^>]+>")


@dataclass
class SketchfabAnnotation:
    index: int
    uid: str
    name: str
    description: str
    eye: list[float] | None
    target: list[float] | None
    position: list[float] | None
    images: list[dict[str, Any]]
    raw_payload: dict[str, Any]


def extract_model_uid(*values: str) -> str:
    for value in values:
        match = SKETCHFAB_UID_RE.search(value or "")
        if match:
            return match.group(1)
    return ""


def strip_html(value: str) -> str:
    return HTML_TAG_RE.sub(" ", value or "").replace("\r", " ").replace("\n", " ").strip()


def normalize_annotation(payload: dict[str, Any], index: int) -> SketchfabAnnotation:
    content = payload.get("content") or {}
    raw_content = content.get("raw") if isinstance(content, dict) else ""
    rendered_content = content.get("rendered") if isinstance(content, dict) else ""

    return SketchfabAnnotation(
        index=index,
        uid=str(payload.get("uid") or ""),
        name=str(payload.get("name") or f"Annotation {index + 1}").strip(),
        description=strip_html(str(raw_content or rendered_content or "")),
        eye=payload.get("eye"),
        target=payload.get("target"),
        position=payload.get("position"),
        images=payload.get("images") if isinstance(payload.get("images"), list) else [],
        raw_payload=payload,
    )


def _balanced_json_object(source: str, start_index: int) -> str:
    start = source.find("{", start_index)
    if start < 0:
        raise ValueError("JSON object start not found.")

    depth = 0
    in_string = False
    escape = False

    for index in range(start, len(source)):
        char = source[index]

        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return source[start:index + 1]

    raise ValueError("JSON object end not found.")


def _fetch_hotspots_from_embed(model_uid: str, timeout: int) -> list[dict[str, Any]]:
    embed_url = f"https://sketchfab.com/models/{quote(model_uid)}/embed"
    text = request_json(embed_url, timeout=timeout).text
    decoded = unescape(text)
    key = f'"/i/models/{model_uid}/hotspots?optimized=1":'
    key_index = decoded.find(key)
    if key_index < 0:
        return []

    json_object = _balanced_json_object(decoded, key_index + len(key))
    data = json.loads(json_object)
    results = data.get("results")
    return results if isinstance(results, list) else []


def fetch_annotations(model_uid: str, timeout: int = 30) -> list[SketchfabAnnotation]:
    if not model_uid:
        raise ValueError("Sketchfab model uid is required.")

    endpoint = f"https://sketchfab.com/i/models/{quote(model_uid)}/hotspots?optimized=1"

    try:
        data = request_json(endpoint, timeout=timeout).data
        raw_annotations = data.get("results") if isinstance(data, dict) else []
    except HttpRequestError:
        raw_annotations = _fetch_hotspots_from_embed(model_uid, timeout)

    if not isinstance(raw_annotations, list):
        return []

    return [
        normalize_annotation(annotation, index)
        for index, annotation in enumerate(raw_annotations)
        if isinstance(annotation, dict)
    ]


def annotations_to_rows(
    annotations: Iterable[SketchfabAnnotation],
    *,
    model_id: str,
    institution_id: str,
    sketchfab_uid: str,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    for annotation in annotations:
        rows.append({
            "model_id": model_id,
            "institution_id": institution_id,
            "sketchfab_uid": sketchfab_uid,
            "annotation_uid": annotation.uid,
            "annotation_index": annotation.index,
            "title": annotation.name,
            "description": annotation.description,
            "eye": annotation.eye,
            "target": annotation.target,
            "position": annotation.position,
            "images": annotation.images,
            "raw_payload": annotation.raw_payload,
        })

    return rows
