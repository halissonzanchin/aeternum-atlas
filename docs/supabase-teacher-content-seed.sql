-- =========================================================
-- AETERNUM ATLAS - DOCENTE OPERACIONAL / CONTEUDO INICIAL
-- =========================================================
-- Objetivo:
-- 1) completar o teacher_profile do professor real;
-- 2) vincular o guia inicial aos modelos Sketchfab principais;
-- 3) vincular a aula inicial aos modelos Sketchfab principais;
-- 4) validar o resultado sem depender de UUIDs decorados.
--
-- Este SQL e idempotente:
-- - usa upsert em teacher_profiles;
-- - atualiza guia/aula somente quando os registros existem;
-- - usa email, slug e titulos estaveis como seletores.
--
-- Pré-requisitos:
-- - tenant ativo com slug = aeternum-test-university
-- - professor = profesorlucasparedes@aeternum.com
-- - modelos =
--   * coracao-humano-superficial
--   * corte-sagital-cranio-humano-superficial
-- - guia = Guia introdutório de anatomia torácica
-- - aula = Aula preparatória — fundamentos anatômicos da Turma A
-- =========================================================

with selected_teacher as (
  select u.id
  from public.users u
  join public.institutions i on i.id = u.institution_id
  where i.slug = 'aeternum-test-university'
    and u.email = 'profesorlucasparedes@aeternum.com'
    and u.role = 'teacher'
  limit 1
),
selected_model as (
  select m.id
  from public.models_3d m
  join public.institutions i on i.id = m.institution_id
  where i.slug = 'aeternum-test-university'
    and m.slug in (
      'coracao-humano-superficial',
      'corte-sagital-cranio-humano-superficial'
    )
)
insert into public.teacher_profiles (
  user_id,
  department,
  specialization,
  allowed_models,
  academic_title
)
select
  selected_teacher.id,
  'Anatomia Humana',
  'Anatomia Cardiovascular',
  jsonb_agg(selected_model.id::text order by selected_model.id::text),
  'Professor de Anatomia'
from selected_teacher
cross join selected_model
group by selected_teacher.id
on conflict (user_id) do update set
  department = excluded.department,
  specialization = excluded.specialization,
  allowed_models = excluded.allowed_models,
  academic_title = excluded.academic_title;

with selected_teacher as (
  select u.id, u.institution_id
  from public.users u
  join public.institutions i on i.id = u.institution_id
  where i.slug = 'aeternum-test-university'
    and u.email = 'profesorlucasparedes@aeternum.com'
    and u.role = 'teacher'
  limit 1
),
selected_model as (
  select m.id
  from public.models_3d m
  join public.institutions i on i.id = m.institution_id
  where i.slug = 'aeternum-test-university'
    and m.slug in (
      'coracao-humano-superficial',
      'corte-sagital-cranio-humano-superficial'
    )
),
selected_model_ids as (
  select jsonb_agg(id::text order by id::text) as model_ids
  from selected_model
)
update public.teacher_study_guides guide
set
  model_ids = selected_model_ids.model_ids,
  updated_at = now()
from selected_model_ids
cross join selected_teacher
where guide.title = 'Guia introdutório de anatomia torácica'
  and guide.teacher_id = selected_teacher.id
  and guide.institution_id = selected_teacher.institution_id
  and selected_model_ids.model_ids is not null;

with selected_teacher as (
  select u.id, u.institution_id
  from public.users u
  join public.institutions i on i.id = u.institution_id
  where i.slug = 'aeternum-test-university'
    and u.email = 'profesorlucasparedes@aeternum.com'
    and u.role = 'teacher'
  limit 1
),
selected_model as (
  select m.id
  from public.models_3d m
  join public.institutions i on i.id = m.institution_id
  where i.slug = 'aeternum-test-university'
    and m.slug in (
      'coracao-humano-superficial',
      'corte-sagital-cranio-humano-superficial'
    )
),
selected_model_ids as (
  select jsonb_agg(id::text order by id::text) as model_ids
  from selected_model
)
update public.teacher_lesson_plans lesson
set
  model_ids = selected_model_ids.model_ids,
  updated_at = now()
from selected_model_ids
cross join selected_teacher
where lesson.title = 'Aula preparatória — fundamentos anatômicos da Turma A'
  and lesson.teacher_id = selected_teacher.id
  and lesson.institution_id = selected_teacher.institution_id
  and selected_model_ids.model_ids is not null;

-- Verificacao final:
select
  'teacher_profile' as dataset,
  tp.user_id::text as ref,
  tp.department as detail
from public.teacher_profiles tp
join public.users u on u.id = tp.user_id
where u.email = 'profesorlucasparedes@aeternum.com'

union all

select
  'study_guide' as dataset,
  guide.id::text as ref,
  guide.model_ids::text as detail
from public.teacher_study_guides guide
where guide.title = 'Guia introdutório de anatomia torácica'

union all

select
  'lesson_plan' as dataset,
  lesson.id::text as ref,
  lesson.model_ids::text as detail
from public.teacher_lesson_plans lesson
where lesson.title = 'Aula preparatória — fundamentos anatômicos da Turma A';
