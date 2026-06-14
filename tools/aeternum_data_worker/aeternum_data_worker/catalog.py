from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any

from .sketchfab import extract_model_uid, fetch_annotations
from .supabase import SupabaseRestClient


ACTIVE_STATUSES = {"active", "available", "ativo", "disponivel", "disponível"}
REQUIRED_MODEL_FIELDS = ("id", "institution_id", "slug", "title", "anatomical_system", "anatomical_region")


def status_is_active(status: str | None) -> bool:
    return str(status or "").strip().lower() in ACTIVE_STATUSES


def summarize_issues(items: list[dict[str, Any]]) -> dict[str, int]:
    counter: Counter[str] = Counter()
    for item in items:
        for issue in item.get("issues", []):
            counter[issue] += 1
    return dict(sorted(counter.items()))


def validate_catalog(
    client: SupabaseRestClient,
    *,
    model_slug: str | None = None,
    institution_slug: str | None = None,
    check_sketchfab: bool = False,
    timeout: int = 30,
) -> dict[str, Any]:
    models = client.list_models(model_slug=model_slug, institution_slug=institution_slug)
    annotations = client.list_annotations([model["id"] for model in models if model.get("id")])

    annotation_count_by_model: dict[str, int] = defaultdict(int)
    for annotation in annotations:
        if annotation.get("model_id"):
            annotation_count_by_model[annotation["model_id"]] += 1

    slug_counter = Counter((model.get("institution_id"), model.get("slug")) for model in models)
    report_items: list[dict[str, Any]] = []

    for model in models:
        issues: list[str] = []
        sketchfab_uid = extract_model_uid(model.get("embed_url") or "", model.get("sketchfab_url") or "")

        for field in REQUIRED_MODEL_FIELDS:
            if not model.get(field):
                issues.append(f"missing_{field}")

        if not sketchfab_uid:
            issues.append("missing_sketchfab_uid")

        if not (model.get("embed_url") or model.get("sketchfab_url")):
            issues.append("missing_sketchfab_url")

        if slug_counter[(model.get("institution_id"), model.get("slug"))] > 1:
            issues.append("duplicate_institution_slug")

        if not status_is_active(model.get("status")):
            issues.append("inactive_status")

        cached_count = annotation_count_by_model.get(model.get("id"), 0)
        if cached_count == 0:
            issues.append("missing_cached_annotations")

        live_count: int | None = None
        live_error = ""
        if check_sketchfab and sketchfab_uid:
            try:
                live_count = len(fetch_annotations(sketchfab_uid, timeout=timeout))
                if live_count != cached_count:
                    issues.append("cached_annotation_count_mismatch")
            except Exception as error:  # noqa: BLE001 - report should keep scanning.
                live_error = str(error)
                issues.append("sketchfab_fetch_failed")

        report_items.append({
            "model_id": model.get("id"),
            "institution_id": model.get("institution_id"),
            "slug": model.get("slug"),
            "title": model.get("title"),
            "status": model.get("status"),
            "sketchfab_uid": sketchfab_uid,
            "cached_annotation_count": cached_count,
            "live_annotation_count": live_count,
            "live_error": live_error,
            "issues": issues,
        })

    return {
        "model_count": len(models),
        "models_with_issues": sum(1 for item in report_items if item["issues"]),
        "issue_summary": summarize_issues(report_items),
        "models": report_items,
    }


def audit_tenancy(
    client: SupabaseRestClient,
    *,
    model_slug: str | None = None,
    institution_slug: str | None = None,
) -> dict[str, Any]:
    models = client.list_models(model_slug=model_slug, institution_slug=institution_slug)
    model_by_id = {model["id"]: model for model in models if model.get("id")}
    annotations = client.list_annotations(list(model_by_id))

    duplicate_keys = [
        {"institution_id": institution_id, "slug": slug, "count": count}
        for (institution_id, slug), count in Counter(
            (model.get("institution_id"), model.get("slug")) for model in models
        ).items()
        if count > 1
    ]

    annotation_mismatches = []
    orphan_annotations = []
    for annotation in annotations:
        model = model_by_id.get(annotation.get("model_id"))
        if not model:
            orphan_annotations.append(annotation)
            continue
        if annotation.get("institution_id") != model.get("institution_id"):
            annotation_mismatches.append({
                "annotation_id": annotation.get("id"),
                "model_id": annotation.get("model_id"),
                "annotation_institution_id": annotation.get("institution_id"),
                "model_institution_id": model.get("institution_id"),
                "title": annotation.get("title"),
            })

    user_issues: list[dict[str, Any]] = []
    try:
        users = client.list_users()
        for user in users:
            role = str(user.get("role") or "").strip().lower()
            if role != "super_admin" and not user.get("institution_id"):
                user_issues.append({
                    "user_id": user.get("id"),
                    "email": user.get("email"),
                    "role": user.get("role"),
                    "issue": "missing_institution_id",
                })
    except Exception as error:  # noqa: BLE001 - anon keys may not be able to read users.
        user_issues.append({"issue": "users_audit_unavailable", "error": str(error)})

    issue_count = len(duplicate_keys) + len(annotation_mismatches) + len(orphan_annotations) + len(user_issues)

    return {
        "model_count": len(models),
        "annotation_count": len(annotations),
        "issue_count": issue_count,
        "duplicate_model_keys": duplicate_keys,
        "annotation_institution_mismatches": annotation_mismatches,
        "orphan_annotations": [
            {
                "annotation_id": item.get("id"),
                "model_id": item.get("model_id"),
                "title": item.get("title"),
            }
            for item in orphan_annotations
        ],
        "user_issues": user_issues,
    }
