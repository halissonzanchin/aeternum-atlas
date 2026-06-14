from __future__ import annotations

from pathlib import Path
from typing import Any
import csv
import json

from .sketchfab import extract_model_uid
from .supabase import SupabaseRestClient


MODEL_COLUMNS = (
    "institution_id",
    "institution_slug",
    "slug",
    "title",
    "anatomical_system",
    "anatomical_region",
    "sketchfab_url",
    "embed_url",
    "difficulty_level",
    "tags",
    "status",
    "thumbnail_url",
)


def _parse_tags(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]

    text = str(value or "").strip()
    if not text:
        return []

    if text.startswith("["):
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        except json.JSONDecodeError:
            pass

    separator = "|" if "|" in text else ","
    return [item.strip() for item in text.split(separator) if item.strip()]


def _load_csv(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return [dict(row) for row in csv.DictReader(file)]


def _load_json(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict) and isinstance(data.get("models"), list):
        return data["models"]
    if isinstance(data, list):
        return data
    raise ValueError("JSON input must be an array or an object with a models array.")


def load_model_file(path: str) -> list[dict[str, Any]]:
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"Input file not found: {file_path}")

    suffix = file_path.suffix.lower()
    if suffix == ".csv":
        return _load_csv(file_path)
    if suffix == ".json":
        return _load_json(file_path)

    raise ValueError("Input file must be .csv or .json.")


def normalize_import_rows(client: SupabaseRestClient, rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    institution_map = client.get_institution_map()
    normalized: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []

    for line_number, row in enumerate(rows, start=2):
        issues: list[str] = []
        institution_id = str(row.get("institution_id") or "").strip()
        institution_slug = str(row.get("institution_slug") or "").strip()

        if not institution_id and institution_slug:
            institution_id = institution_map.get(institution_slug, "")

        record = {
            "institution_id": institution_id,
            "slug": str(row.get("slug") or "").strip(),
            "title": str(row.get("title") or "").strip(),
            "anatomical_system": str(row.get("anatomical_system") or "").strip(),
            "anatomical_region": str(row.get("anatomical_region") or "").strip(),
            "sketchfab_url": str(row.get("sketchfab_url") or "").strip(),
            "embed_url": str(row.get("embed_url") or "").strip(),
            "difficulty_level": str(row.get("difficulty_level") or "basic").strip(),
            "tags": _parse_tags(row.get("tags")),
            "status": str(row.get("status") or "active").strip(),
            "thumbnail_url": str(row.get("thumbnail_url") or "").strip() or None,
        }

        for field in ("institution_id", "slug", "title", "anatomical_system", "anatomical_region"):
            if not record[field]:
                issues.append(f"missing_{field}")

        if not (record["sketchfab_url"] or record["embed_url"]):
            issues.append("missing_sketchfab_url")

        if (record["sketchfab_url"] or record["embed_url"]) and not extract_model_uid(record["embed_url"], record["sketchfab_url"]):
            issues.append("invalid_sketchfab_uid")

        if issues:
            errors.append({
                "line": line_number,
                "slug": record["slug"],
                "institution_slug": institution_slug,
                "issues": issues,
            })
        else:
            normalized.append(record)

    return normalized, errors
