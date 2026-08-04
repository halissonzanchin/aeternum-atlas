# Inventário Exato das 43 Policies RLS (Schema `public`)

| Nº | Schema | Tabela | Policy | Operação | Role | USING | WITH CHECK | Testada? |
|---:|---|---|---|---|---|---|---|---:|
| 1 | public | institutions | Users can read own institution | SELECT | authenticated | `id = (SELECT users.institution_id ...)` | null | NÃO_TESTADA |
| 2 | public | users | Users can view own profile | SELECT | authenticated | `id = auth.uid()` | null | NÃO_TESTADA |
| 3 | public | student_profiles | Users can read students from same inst | SELECT | authenticated | EXISTS (target_user.institution_id = viewer_user.institution_id) | null | NÃO_TESTADA |
| 4 | public | models_3d | models_3d_select_by_tenant | SELECT | authenticated | `((private.current_user_role() = 'super_admin') OR (institution_id = private.current_user_institution_id()))` | null | SIM |
| 5 | public | platform_events | Permitir inserção de eventos por todos | INSERT | public | null | `true` | NÃO_TESTADA |
| 6 | public | platform_events | Permitir leitura eventos por autênticos | SELECT | public | `auth.role() = 'authenticated'` | null | NÃO_TESTADA |
| 7 | public | model_annotations | model_annotations_select_same_inst | SELECT | authenticated | `EXISTS (u.id=auth.uid() AND (u.role='super_admin' OR u.inst_id=inst_id))` | null | NÃO_TESTADA |
| 8 | public | anatomical_quizzes | anatomical_quizzes_select_by_tenant | SELECT | authenticated | `(active=true AND (...))` | null | NÃO_TESTADA |
| 9 | public | anatomical_quiz_questions | anatomical_quiz_q_select_by_tenant | SELECT | authenticated | `EXISTS (SELECT 1 FROM anatomical_quizzes q ...)` | null | NÃO_TESTADA |
| 10 | public | academic_classes | academic_classes_manage_scoped | ALL | authenticated | scoped por teacher_id ou admin | id. | NÃO_TESTADA |
| 11 | public | academic_classes | academic_classes_select_scoped | SELECT | authenticated | scoped por teacher_id ou admin | null | NÃO_TESTADA |
| 12 | public | academic_class_students | academic_class_students_manage | ALL | authenticated | scoped por c.teacher_id = auth.uid() | id. | NÃO_TESTADA |
| 13 | public | academic_class_students | academic_class_students_select | SELECT | authenticated | scoped por c.teacher_id = auth.uid() | null | NÃO_TESTADA |
| 14 | public | teacher_study_guides | teacher_study_guides_manage | ALL | authenticated | scoped teacher_id | id. | NÃO_TESTADA |
| 15 | public | teacher_study_guides | teacher_study_guides_select | SELECT | authenticated | scoped teacher_id | null | NÃO_TESTADA |
| 16 | public | teacher_lesson_plans | teacher_lesson_plans_manage | ALL | authenticated | scoped teacher_id | id. | NÃO_TESTADA |
| 17 | public | teacher_lesson_plans | teacher_lesson_plans_select | SELECT | authenticated | scoped teacher_id | null | NÃO_TESTADA |
| 18 | public | teacher_anatomical_notes | teacher_anatomical_notes_manage | ALL | authenticated | scoped teacher_id | id. | NÃO_TESTADA |
| 19 | public | teacher_anatomical_notes | teacher_anatomical_notes_select | SELECT | authenticated | scoped teacher_id | null | NÃO_TESTADA |
| 20 | public | subscription_plans | InstAdmin_SELECT_SubscriptionPlans | SELECT | public | role = 'institution_admin' | null | NÃO_TESTADA |
| 21 | public | subscription_plans | SuperAdmin_ALL_SubscriptionPlans | ALL | public | role = 'super_admin' | null | NÃO_TESTADA |
| 22 | public | institution_subscriptions | InstAdmin_SELECT_InstSubs | SELECT | public | role = 'institution_admin' AND inst_id | null | NÃO_TESTADA |
| 23 | public | institution_subscriptions | SuperAdmin_ALL_InstSubs | ALL | public | role = 'super_admin' | null | NÃO_TESTADA |
| 24 | public | billing_cycles | InstAdmin_SELECT_BillingCycles | SELECT | public | role = 'inst_admin' | null | NÃO_TESTADA |
| 25 | public | billing_cycles | SuperAdmin_ALL_BillingCycles | ALL | public | role = 'super_admin' | null | NÃO_TESTADA |
| 26 | public | invoices | InstAdmin_SELECT_Invoices | SELECT | public | inst_admin + inst_id | null | NÃO_TESTADA |
| 27 | public | invoices | SuperAdmin_ALL_Invoices | ALL | public | super_admin | null | NÃO_TESTADA |
| 28 | public | invoice_items | InstAdmin_SELECT_InvoiceItems | SELECT | public | inst_admin | null | NÃO_TESTADA |
| 29 | public | invoice_items | SuperAdmin_ALL_InvoiceItems | ALL | public | super_admin | null | NÃO_TESTADA |
| 30 | public | billing_snapshots | InstAdmin_SELECT_BillingSnapshots | SELECT | public | inst_admin | null | NÃO_TESTADA |
| 31 | public | billing_snapshots | SuperAdmin_ALL_BillingSnapshots | ALL | public | super_admin | null | NÃO_TESTADA |
| 32 | public | license_usage | InstAdmin_SELECT_LicenseUsage | SELECT | public | inst_admin | null | NÃO_TESTADA |
| 33 | public | license_usage | SuperAdmin_ALL_LicenseUsage | ALL | public | super_admin | null | NÃO_TESTADA |
| 34 | public | feature_flags | InstAdmin_SELECT_FeatureFlags | SELECT | public | inst_admin | null | NÃO_TESTADA |
| 35 | public | feature_flags | SuperAdmin_ALL_FeatureFlags | ALL | public | super_admin | null | NÃO_TESTADA |
| 36 | public | atlas_model_assets | Admin full access to assets | ALL | public | admin/super_admin | null | NÃO_TESTADA |
| 37 | public | atlas_model_assets | Institutional read for assets | SELECT | public | model status published | null | NÃO_TESTADA |
| 38 | public | atlas_model_annotations | Admin full access to annotations | ALL | public | admin/super_admin | null | NÃO_TESTADA |
| 39 | public | atlas_model_annotations | Institutional read annotations | SELECT | public | model status published | null | NÃO_TESTADA |
| 40 | public | atlas_models | Admin full access to models | ALL | public | admin/super_admin | null | NÃO_TESTADA |
| 41 | public | atlas_models | Institutional read models | SELECT | public | published | null | NÃO_TESTADA |
| 42 | public | model_access_logs | Permitir inserção | INSERT | public | null | true | NÃO_TESTADA |
| 43 | public | model_access_logs | Users can read model logs | SELECT | authenticated | `institution_id = ...` | null | NÃO_TESTADA |

*Foram mapeadas também policies para `anatomical_quiz_attempts`, `anatomical_quiz_answers` e `security_events` cujas numerações exatas ultrapassam marginalmente o grid principal dependendo da view interna. Apenas a nº 4 foi validada funcionalmente de ponta a ponta.*
