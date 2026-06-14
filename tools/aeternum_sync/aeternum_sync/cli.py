from __future__ import annotations

from argparse import ArgumentParser, Namespace
from dataclasses import asdict
from typing import Any
import json
import sys

from .env import get_env, load_env_file
from .sketchfab import annotations_to_rows, extract_model_uid, fetch_annotations
from .supabase import SupabaseRestClient


ACTIVE_STATUSES = {"active", "available", "ativo", "disponivel", "disponível"}


def _print_json(data: Any) -> None:
    print(json.dumps(data, indent=2, ensure_ascii=False))


def _status_is_active(status: str | None) -> bool:
    return str(status or "").strip().lower() in ACTIVE_STATUSES


def fetch_command(args: Namespace) -> int:
    model_uid = args.sketchfab_uid or extract_model_uid(args.sketchfab_url or "")
    if not model_uid:
        raise RuntimeError("Informe --sketchfab-url ou --sketchfab-uid.")

    annotations = fetch_annotations(model_uid, timeout=args.timeout)
    payload = {
        "sketchfab_uid": model_uid,
        "annotation_count": len(annotations),
        "annotations": [asdict(annotation) for annotation in annotations],
    }
    _print_json(payload)
    return 0


def sync_command(args: Namespace) -> int:
    load_env_file(args.env)

    supabase_url = get_env("SUPABASE_URL", "VITE_SUPABASE_URL", required=True)
    if args.apply:
        supabase_key = get_env("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", required=True)
    else:
        supabase_key = get_env(
            "SUPABASE_SERVICE_ROLE_KEY",
            "SUPABASE_SECRET_KEY",
            "SUPABASE_ANON_KEY",
            "VITE_SUPABASE_ANON_KEY",
            required=True,
        )
    client = SupabaseRestClient(supabase_url, supabase_key)
    models = client.list_models(model_slug=args.model_slug, institution_slug=args.institution_slug)

    report: list[dict[str, Any]] = []

    for model in models:
        if args.active_only and not _status_is_active(model.get("status")):
            continue

        sketchfab_uid = extract_model_uid(model.get("embed_url") or "", model.get("sketchfab_url") or "")
        model_report: dict[str, Any] = {
            "model_id": model.get("id"),
            "institution_id": model.get("institution_id"),
            "slug": model.get("slug"),
            "title": model.get("title"),
            "status": model.get("status"),
            "sketchfab_uid": sketchfab_uid,
            "annotation_count": 0,
            "synced": False,
            "error": "",
        }

        if not sketchfab_uid:
            model_report["error"] = "missing_sketchfab_uid"
            report.append(model_report)
            continue

        try:
            annotations = fetch_annotations(sketchfab_uid, timeout=args.timeout)
            rows = annotations_to_rows(
                annotations,
                model_id=model["id"],
                institution_id=model["institution_id"],
                sketchfab_uid=sketchfab_uid,
            )
            model_report["annotation_count"] = len(rows)
            model_report["annotations"] = [row["title"] for row in rows]

            if args.apply:
                upserted = client.upsert_annotations(rows)
                model_report["synced"] = True
                model_report["upserted_count"] = len(upserted)
            else:
                model_report["dry_run"] = True

        except Exception as error:  # noqa: BLE001 - CLI report should keep running across models.
            model_report["error"] = str(error)

        report.append(model_report)

    _print_json({
        "mode": "apply" if args.apply else "dry-run",
        "model_count": len(report),
        "report": report,
    })

    if args.apply:
        print("\nSync concluído. Revise o relatório acima para modelos com erro.")
    else:
        print("\nDry-run concluído. Rode novamente com --apply para gravar no Supabase.")

    return 0


def build_parser() -> ArgumentParser:
    parser = ArgumentParser(
        prog="aeternum-sync",
        description="Synchronize Sketchfab model annotations into Aeternum Atlas Supabase tables.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    fetch_parser = subparsers.add_parser("fetch", help="Fetch annotations from one Sketchfab model.")
    fetch_parser.add_argument("--sketchfab-url", default="", help="Sketchfab model or embed URL.")
    fetch_parser.add_argument("--sketchfab-uid", default="", help="Sketchfab 32-character model UID.")
    fetch_parser.add_argument("--timeout", type=int, default=30, help="HTTP timeout in seconds.")
    fetch_parser.set_defaults(func=fetch_command)

    sync_parser = subparsers.add_parser("sync", help="Fetch annotations for Supabase models_3d rows.")
    sync_parser.add_argument("--env", default=".env", help="Env file path. Defaults to .env.")
    sync_parser.add_argument("--apply", action="store_true", help="Write annotations to Supabase.")
    sync_parser.add_argument("--model-slug", default="", help="Limit sync to one models_3d.slug.")
    sync_parser.add_argument("--institution-slug", default="", help="Limit sync to one institutions.slug.")
    sync_parser.add_argument("--timeout", type=int, default=30, help="HTTP timeout in seconds.")
    sync_parser.add_argument("--include-inactive", action="store_false", dest="active_only", help="Include inactive models.")
    sync_parser.set_defaults(func=sync_command)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if hasattr(args, "model_slug"):
        args.model_slug = args.model_slug or None
    if hasattr(args, "institution_slug"):
        args.institution_slug = args.institution_slug or None
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
