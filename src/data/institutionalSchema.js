export const institutionalSchema = {
  users: [
    "id",
    "name",
    "email",
    "password_hash",
    "role",
    "institution_id",
    "course",
    "semester",
    "student_registration",
    "status",
    "created_at",
    "last_login_at"
  ],
  institutions: [
    "id",
    "name",
    "country",
    "city",
    "contract_type",
    "billing_model",
    "price_per_registered_student",
    "price_per_active_student",
    "license_status",
    "license_start",
    "license_end",
    "created_at"
  ],
  model_access_logs: [
    "id",
    "user_id",
    "institution_id",
    "model_id",
    "action",
    "started_at",
    "ended_at",
    "duration_seconds",
    "created_at"
  ],
  student_monthly_usage: [
    "id",
    "user_id",
    "institution_id",
    "month",
    "year",
    "total_logins",
    "total_models_opened",
    "total_study_minutes",
    "active_status"
  ],
  institution_monthly_billing: [
    "id",
    "institution_id",
    "month",
    "year",
    "registered_students",
    "active_students",
    "billable_students",
    "price_per_student",
    "estimated_total",
    "generated_at"
  ],
  favorites: [
    "id",
    "user_id",
    "institution_id",
    "model_id",
    "created_at"
  ],
  study_progress: [
    "id",
    "user_id",
    "institution_id",
    "model_id",
    "completed",
    "progress_percent",
    "completed_at",
    "updated_at"
  ]
};
