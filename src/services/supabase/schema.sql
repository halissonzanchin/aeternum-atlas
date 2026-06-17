-- Aeternum Atlas - Supabase/PostgreSQL initial schema
-- Multi-tenant rule: every institutional record carries institution_id.

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  country text,
  city text,
  active boolean not null default true,
  contracted_capacity integer not null default 0,
  active_students integer not null default 0,
  price_per_student numeric(12,2) not null default 0,
  contract_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete set null,
  name text not null,
  email text unique not null,
  role text not null check (role in ('student', 'teacher', 'institution_admin', 'super_admin')),
  status text not null default 'active',
  avatar_url text,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  course text,
  semester text,
  registration_number text,
  progress_score integer not null default 0,
  total_study_minutes integer not null default 0,
  favorite_models jsonb not null default '[]'::jsonb,
  last_access_at timestamptz
);

create table if not exists public.teacher_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  department text,
  specialization text,
  allowed_models jsonb not null default '[]'::jsonb,
  academic_title text
);

create table if not exists public.models_3d (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  title text not null,
  slug text not null,
  anatomical_system text,
  anatomical_region text,
  sketchfab_url text,
  embed_url text,
  difficulty_level text,
  tags jsonb not null default '[]'::jsonb,
  status text not null default 'available',
  thumbnail_url text,
  created_at timestamptz not null default now(),
  unique (institution_id, slug)
);

create table if not exists public.model_access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete cascade,
  model_id uuid references public.models_3d(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer,
  interactions_count integer not null default 0,
  annotations_opened integer not null default 0,
  device_type text
);

create table if not exists public.study_agenda (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  priority text not null default 'medium',
  anatomical_system text,
  linked_model_id uuid references public.models_3d(id) on delete set null,
  status text not null default 'pending',
  reminder_enabled boolean not null default false
);

create table if not exists public.platform_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  institution_id uuid references public.institutions(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  model_id uuid references public.models_3d(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists users_institution_role_idx on public.users(institution_id, role);
create index if not exists models_3d_institution_idx on public.models_3d(institution_id);
create index if not exists model_access_logs_institution_started_idx on public.model_access_logs(institution_id, started_at desc);
create index if not exists study_agenda_user_date_idx on public.study_agenda(user_id, date);
create index if not exists platform_events_institution_created_idx on public.platform_events(institution_id, created_at desc);
create index if not exists security_events_institution_created_idx on public.security_events(institution_id, created_at desc);
create index if not exists security_events_user_created_idx on public.security_events(user_id, created_at desc);
create index if not exists security_events_model_created_idx on public.security_events(model_id, created_at desc);

-- Added missing tables based on remote schema sync
create table if not exists public.academic_classes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  course text,
  semester text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academic_class_students (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id uuid not null references public.academic_classes(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.anatomical_quizzes (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models_3d(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  title text not null,
  description text,
  time_limit_seconds integer not null default 300,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.anatomical_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.anatomical_quizzes(id) on delete cascade,
  marker_number integer not null,
  correct_answer text not null,
  accepted_answers text[],
  anatomical_description text,
  order_index integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.anatomical_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.anatomical_quizzes(id) on delete cascade,
  model_id uuid not null references public.models_3d(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score integer not null default 0,
  total_questions integer not null default 10,
  percentage numeric,
  duration_seconds integer,
  status text not null default 'in_progress'
);

create table if not exists public.anatomical_quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.anatomical_quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.anatomical_quiz_questions(id) on delete cascade,
  marker_number integer not null,
  student_answer text,
  correct_answer text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.model_annotations (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models_3d(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  sketchfab_uid text not null,
  annotation_uid text,
  annotation_index integer not null,
  title text not null,
  description text,
  eye jsonb,
  target jsonb,
  position jsonb,
  images jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  source text not null default 'sketchfab',
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_anatomical_notes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  model_id uuid references public.models_3d(id) on delete cascade,
  structure text,
  note_type text not null default 'didactic',
  description text not null,
  priority text not null default 'medium',
  status text not null default 'open',
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_lesson_plans (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  class_id uuid references public.academic_classes(id) on delete set null,
  title text not null,
  scheduled_for timestamptz,
  model_ids jsonb not null default '[]'::jsonb,
  key_structures jsonb not null default '[]'::jsonb,
  objectives jsonb not null default '[]'::jsonb,
  notes text,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_study_guides (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  class_id uuid references public.academic_classes(id) on delete set null,
  title text not null,
  description text,
  objectives jsonb not null default '[]'::jsonb,
  model_ids jsonb not null default '[]'::jsonb,
  due_date date,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
- -   M i g r a t i o n :   F a s e   3 C   -   S i m u l a d o s   T e � � r i c o s   e   A n a l y t i c s   A c a d � � m i c o s  
 - -   D e s c r i p t i o n :   A d i c i o n a   c l a s s _ i d   a o s   s i m u l a d o s   a n a t � � m i c o s   e x i s t e n t e s   e   c r i a   a s   t a b e l a s   c o m p l e t a s   p a r a   S i m u l a d o s   T e � � r i c o s .  
  
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  
 - -   1 .   E X T E N S � �O   D A   T A B E L A   D E   T E N T A T I V A S   A N A T �  M I C A S   ( A N A L Y T I C S )  
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  
 A L T E R   T A B L E   p u b l i c . a n a t o m i c a l _ q u i z _ a t t e m p t s  
 A D D   C O L U M N   I F   N O T   E X I S T S   c l a s s _ i d   u u i d   r e f e r e n c e s   p u b l i c . a c a d e m i c _ c l a s s e s ( i d )   o n   d e l e t e   s e t   n u l l ;  
  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   a n a t o m i c a l _ q u i z _ a t t e m p t s _ c l a s s _ i d x   O N   p u b l i c . a n a t o m i c a l _ q u i z _ a t t e m p t s ( c l a s s _ i d ) ;  
  
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  
 - -   2 .   N O V A S   T A B E L A S   D E   S I M U L A D O S   T E �  R I C O S  
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  
  
 - -   2 . 1   t h e o r e t i c a l _ q u i z z e s   ( C a b e � � a l h o   d o   S i m u l a d o )  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . t h e o r e t i c a l _ q u i z z e s   (  
     i d   u u i d   p r i m a r y   k e y   d e f a u l t   g e n _ r a n d o m _ u u i d ( ) ,  
     i n s t i t u t i o n _ i d   u u i d   n o t   n u l l   r e f e r e n c e s   p u b l i c . i n s t i t u t i o n s ( i d )   o n   d e l e t e   c a s c a d e ,  
     t e a c h e r _ i d   u u i d   r e f e r e n c e s   p u b l i c . u s e r s ( i d )   o n   d e l e t e   s e t   n u l l ,  
     m o d e l _ i d   u u i d   r e f e r e n c e s   p u b l i c . m o d e l s _ 3 d ( i d )   o n   d e l e t e   s e t   n u l l ,  
     c l a s s _ i d   u u i d   r e f e r e n c e s   p u b l i c . a c a d e m i c _ c l a s s e s ( i d )   o n   d e l e t e   s e t   n u l l ,  
     t i t l e   t e x t   n o t   n u l l ,  
     d e s c r i p t i o n   t e x t ,  
     t i m e _ l i m i t _ s e c o n d s   i n t e g e r   n o t   n u l l   d e f a u l t   3 6 0 0 ,  
     a c t i v e   b o o l e a n   n o t   n u l l   d e f a u l t   t r u e ,  
     c r e a t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( ) ,  
     u p d a t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( )  
 ) ;  
  
 - -   2 . 2   t h e o r e t i c a l _ q u i z _ q u e s t i o n s   ( C o r p o   d a s   P e r g u n t a s )  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . t h e o r e t i c a l _ q u i z _ q u e s t i o n s   (  
     i d   u u i d   p r i m a r y   k e y   d e f a u l t   g e n _ r a n d o m _ u u i d ( ) ,  
     q u i z _ i d   u u i d   n o t   n u l l   r e f e r e n c e s   p u b l i c . t h e o r e t i c a l _ q u i z z e s ( i d )   o n   d e l e t e   c a s c a d e ,  
     t o p i c   t e x t ,  
     q u e s t i o n _ t y p e   t e x t   n o t   n u l l ,   - -   ' m u l t i p l e _ c h o i c e ' ,   ' t r u e _ f a l s e ' ,   ' s h o r t _ a n s w e r ' ,   ' f i l l _ i n _ t h e _ b l a n k ' ,   ' m a t c h i n g '  
     q u e s t i o n _ t e x t   t e x t   n o t   n u l l ,  
     o p t i o n s   j s o n b ,   - -   A r r a y   d a s   a l t e r n a t i v a s  
     c o r r e c t _ a n s w e r   j s o n b ,   - -   R e s p o s t a   e s p e r a d a   f o r m a l  
     a c c e p t e d _ a n s w e r s   j s o n b ,   - -   R e s p o s t a s   a l t e r n a t i v a s   p a r a   c o r r e � � � � o   a u t o m � � t i c a   ( F i l l ,   S h o r t )  
     j u s t i f i c a t i o n   t e x t ,  
     b i b l i o g r a p h i c _ r e f e r e n c e   t e x t ,  
     d i f f i c u l t y _ l e v e l   t e x t   d e f a u l t   ' m e d i u m ' ,  
     a n a t o m i c a l _ t a g s   t e x t [ ] ,   - -   A r r a y   t e x t  
     o r d e r _ i n d e x   i n t e g e r   n o t   n u l l   d e f a u l t   0 ,  
     c r e a t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( )  
 ) ;  
  
 - -   2 . 3   t h e o r e t i c a l _ q u i z _ a t t e m p t s   ( T e n t a t i v a s   d o s   A l u n o s )  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . t h e o r e t i c a l _ q u i z _ a t t e m p t s   (  
     i d   u u i d   p r i m a r y   k e y   d e f a u l t   g e n _ r a n d o m _ u u i d ( ) ,  
     q u i z _ i d   u u i d   n o t   n u l l   r e f e r e n c e s   p u b l i c . t h e o r e t i c a l _ q u i z z e s ( i d )   o n   d e l e t e   c a s c a d e ,  
     u s e r _ i d   u u i d   n o t   n u l l   r e f e r e n c e s   p u b l i c . u s e r s ( i d )   o n   d e l e t e   c a s c a d e ,  
     i n s t i t u t i o n _ i d   u u i d   n o t   n u l l   r e f e r e n c e s   p u b l i c . i n s t i t u t i o n s ( i d )   o n   d e l e t e   c a s c a d e ,  
     c l a s s _ i d   u u i d   r e f e r e n c e s   p u b l i c . a c a d e m i c _ c l a s s e s ( i d )   o n   d e l e t e   s e t   n u l l ,  
     s t a r t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( ) ,  
     f i n i s h e d _ a t   t i m e s t a m p t z ,  
     s c o r e   i n t e g e r   n o t   n u l l   d e f a u l t   0 ,  
     t o t a l _ q u e s t i o n s   i n t e g e r   n o t   n u l l   d e f a u l t   0 ,  
     p e r c e n t a g e   n u m e r i c ,  
     d u r a t i o n _ s e c o n d s   i n t e g e r ,  
     s t a t u s   t e x t   n o t   n u l l   d e f a u l t   ' i n _ p r o g r e s s ' ,   - -   ' i n _ p r o g r e s s ' ,   ' c o m p l e t e d '  
     c r e a t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( )  
 ) ;  
  
 - -   2 . 4   t h e o r e t i c a l _ q u i z _ a n s w e r s   ( R e s p o s t a s   I n d i v i d u a i s   d o s   A l u n o s )  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . t h e o r e t i c a l _ q u i z _ a n s w e r s   (  
     i d   u u i d   p r i m a r y   k e y   d e f a u l t   g e n _ r a n d o m _ u u i d ( ) ,  
     a t t e m p t _ i d   u u i d   n o t   n u l l   r e f e r e n c e s   p u b l i c . t h e o r e t i c a l _ q u i z _ a t t e m p t s ( i d )   o n   d e l e t e   c a s c a d e ,  
     q u e s t i o n _ i d   u u i d   n o t   n u l l   r e f e r e n c e s   p u b l i c . t h e o r e t i c a l _ q u i z _ q u e s t i o n s ( i d )   o n   d e l e t e   c a s c a d e ,  
     s t u d e n t _ a n s w e r   j s o n b ,  
     i s _ c o r r e c t   b o o l e a n   n o t   n u l l   d e f a u l t   f a l s e ,  
     f e e d b a c k   t e x t ,   - -   F e e d b a c k   m a n u a l   d o   p r o f e s s o r   e m   q u e s t � � e s   d i s c u r s i v a s  
     c r e a t e d _ a t   t i m e s t a m p t z   n o t   n u l l   d e f a u l t   n o w ( )  
 ) ;  
  
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  
 - -   3 .   � � N D I C E S   D E   P E R F O R M A N C E   ( A N A L Y T I C S )  
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   t h e o r e t i c a l _ q u i z z e s _ i n s t i t u t i o n _ i d x   O N   p u b l i c . t h e o r e t i c a l _ q u i z z e s ( i n s t i t u t i o n _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   t h e o r e t i c a l _ q u i z z e s _ c l a s s _ i d x   O N   p u b l i c . t h e o r e t i c a l _ q u i z z e s ( c l a s s _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   t h e o r e t i c a l _ q u i z z e s _ t e a c h e r _ i d x   O N   p u b l i c . t h e o r e t i c a l _ q u i z z e s ( t e a c h e r _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   t h e o r e t i c a l _ q u i z _ a t t e m p t s _ q u i z _ i d x   O N   p u b l i c . t h e o r e t i c a l _ q u i z _ a t t e m p t s ( q u i z _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   t h e o r e t i c a l _ q u i z _ a t t e m p t s _ u s e r _ i d x   O N   p u b l i c . t h e o r e t i c a l _ q u i z _ a t t e m p t s ( u s e r _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   t h e o r e t i c a l _ q u i z _ a t t e m p t s _ c l a s s _ i d x   O N   p u b l i c . t h e o r e t i c a l _ q u i z _ a t t e m p t s ( c l a s s _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   t h e o r e t i c a l _ q u i z _ a t t e m p t s _ i n s t i t u t i o n _ i d x   O N   p u b l i c . t h e o r e t i c a l _ q u i z _ a t t e m p t s ( i n s t i t u t i o n _ i d ) ;  
  
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  
 - -   4 .   R O W   L E V E L   S E C U R I T Y   ( R L S )   -   P O L � � T I C A S   B � � S I C A S  
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  
 A L T E R   T A B L E   p u b l i c . t h e o r e t i c a l _ q u i z z e s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p u b l i c . t h e o r e t i c a l _ q u i z _ q u e s t i o n s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p u b l i c . t h e o r e t i c a l _ q u i z _ a t t e m p t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p u b l i c . t h e o r e t i c a l _ q u i z _ a n s w e r s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
  
 - -   E x e m p l o   C l � � s s i c o   ( S u p o n d o   q u e   R L S   � �   u s a d o   c o m   j w t _ c l a i m s )  
 - -   A p e n a s   u m   e s c o p o   i l u s t r a t i v o   c o n f o r m e   s o l i c i t a d o   p a r a   v a l i d a � � � � o :  
  
 - -   Q u i z z e s :   T o d o s   o s   u s u � � r i o s   l o g a d o s   v e e m   o s   q u i z z e s   d e   s u a   i n s t i t u i � � � � o  
 C R E A T E   P O L I C Y   t h e o r e t i c a l _ q u i z z e s _ i n s t i t u t i o n _ i s o l a t i o n   O N   p u b l i c . t h e o r e t i c a l _ q u i z z e s  
     F O R   S E L E C T   U S I N G   ( i n s t i t u t i o n _ i d   =   a u t h . j w t ( ) - > > ' i n s t i t u t i o n _ i d ' ) ;  
  
 - -   T e n t a t i v a s :   A l u n o   s � �   v � �   a s   d e l e ,   P r o f e s s o r   v � �   o s   d a   s u a   i n s t i t u i � � � � o / t u r m a  
 C R E A T E   P O L I C Y   t h e o r e t i c a l _ a t t e m p t s _ u s e r _ i s o l a t i o n   O N   p u b l i c . t h e o r e t i c a l _ q u i z _ a t t e m p t s  
     F O R   S E L E C T   U S I N G   (  
         u s e r _ i d   =   a u t h . u i d ( )   O R  
         a u t h . j w t ( ) - > > ' r o l e '   I N   ( ' t e a c h e r ' ,   ' i n s t i t u t i o n _ a d m i n ' ,   ' s u p e r _ a d m i n ' )  
     ) ;  
  
 C R E A T E   P O L I C Y   t h e o r e t i c a l _ a t t e m p t s _ i n s e r t   O N   p u b l i c . t h e o r e t i c a l _ q u i z _ a t t e m p t s  
     F O R   I N S E R T   W I T H   C H E C K   ( u s e r _ i d   =   a u t h . u i d ( ) ) ;  
  
 - -   R e s p o s t a s :   A l u n o   v � �   a p e n a s   a s   d e l e  
 C R E A T E   P O L I C Y   t h e o r e t i c a l _ a n s w e r s _ u s e r _ i s o l a t i o n   O N   p u b l i c . t h e o r e t i c a l _ q u i z _ a n s w e r s  
     F O R   S E L E C T   U S I N G   (  
         E X I S T S   (  
             S E L E C T   1   F R O M   p u b l i c . t h e o r e t i c a l _ q u i z _ a t t e m p t s   a    
             W H E R E   a . i d   =   a t t e m p t _ i d   A N D   a . u s e r _ i d   =   a u t h . u i d ( )  
         )   O R  
         a u t h . j w t ( ) - > > ' r o l e '   I N   ( ' t e a c h e r ' ,   ' i n s t i t u t i o n _ a d m i n ' ,   ' s u p e r _ a d m i n ' )  
     ) ;  
 

-- Migration: Fase 4D - Academic Hierarchy Foundation
-- Description: Cria a estrutura hierárquica acadêmica (Campus, Curso, Período, Disciplina) 
-- para suportar operações em escala universitária B2B. Mantém total compatibilidade
-- retroativa com o modelo "Plano" original através de campos nullable em academic_classes.

--------------------------------------------------------------------------------
-- 1. NOVAS TABELAS HIERÁRQUICAS
--------------------------------------------------------------------------------

-- 1.1 academic_campuses
CREATE TABLE IF NOT EXISTS public.academic_campuses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.2 academic_courses
CREATE TABLE IF NOT EXISTS public.academic_courses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  campus_id uuid references public.academic_campuses(id) on delete set null,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.3 academic_terms (Períodos/Semestres)
CREATE TABLE IF NOT EXISTS public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null, -- Ex: '2026.1', '1º Semestre 2026'
  start_date date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.4 academic_subjects (Disciplinas)
CREATE TABLE IF NOT EXISTS public.academic_subjects (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  course_id uuid references public.academic_courses(id) on delete cascade,
  name text not null, -- Ex: 'Anatomia Humana I'
  code text, -- Código da disciplina (ex: MED-ANA-101)
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

--------------------------------------------------------------------------------
-- 2. ALTERAÇÃO NA TABELA DE TURMAS EXISTENTE (Retrocompatível)
--------------------------------------------------------------------------------

-- Adicionamos colunas nullable para amarrar a turma na nova hierarquia.
-- As turmas antigas continuarão funcionando perfeitamente (campos nulls são permitidos).
ALTER TABLE public.academic_classes
ADD COLUMN IF NOT EXISTS campus_id uuid references public.academic_campuses(id) on delete set null,
ADD COLUMN IF NOT EXISTS course_id uuid references public.academic_courses(id) on delete set null,
ADD COLUMN IF NOT EXISTS term_id uuid references public.academic_terms(id) on delete set null,
ADD COLUMN IF NOT EXISTS subject_id uuid references public.academic_subjects(id) on delete set null;

--------------------------------------------------------------------------------
-- 3. ÍNDICES DE PERFORMANCE PARA RELATÓRIOS E INTEGRAÇÕES
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS academic_campuses_inst_idx ON public.academic_campuses(institution_id);
CREATE INDEX IF NOT EXISTS academic_courses_inst_idx ON public.academic_courses(institution_id);
CREATE INDEX IF NOT EXISTS academic_courses_campus_idx ON public.academic_courses(campus_id);
CREATE INDEX IF NOT EXISTS academic_terms_inst_idx ON public.academic_terms(institution_id);
CREATE INDEX IF NOT EXISTS academic_subjects_inst_idx ON public.academic_subjects(institution_id);
CREATE INDEX IF NOT EXISTS academic_subjects_course_idx ON public.academic_subjects(course_id);

CREATE INDEX IF NOT EXISTS academic_classes_campus_idx ON public.academic_classes(campus_id);
CREATE INDEX IF NOT EXISTS academic_classes_course_idx ON public.academic_classes(course_id);
CREATE INDEX IF NOT EXISTS academic_classes_term_idx ON public.academic_classes(term_id);
CREATE INDEX IF NOT EXISTS academic_classes_subject_idx ON public.academic_classes(subject_id);

--------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) - ISOLAMENTO MULTI-TENANT
--------------------------------------------------------------------------------
ALTER TABLE public.academic_campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_subjects ENABLE ROW LEVEL SECURITY;

-- Exemplo de Policies Base (As políticas exatas devem refletir a role JWT e o institution_id)
-- Usuários podem ler (SELECT) dados se pertencerem à instituição correta.
CREATE POLICY campuses_inst_isolation ON public.academic_campuses
  FOR SELECT USING (institution_id = auth.jwt()->>'institution_id');

CREATE POLICY courses_inst_isolation ON public.academic_courses
  FOR SELECT USING (institution_id = auth.jwt()->>'institution_id');

CREATE POLICY terms_inst_isolation ON public.academic_terms
  FOR SELECT USING (institution_id = auth.jwt()->>'institution_id');

CREATE POLICY subjects_inst_isolation ON public.academic_subjects
  FOR SELECT USING (institution_id = auth.jwt()->>'institution_id');


-- ==============================================================================
-- FASE 5.2B - BILLING FOUNDATION (AETERNUM ATLAS)
-- Data: 2026-06-17
-- Objetivo: Arquitetura Financeira B2B (Soft Block, True-Up, Snapshots)
-- ==============================================================================

-- 1. SUBSCRIPTION PLANS
-- Catálogo de pacotes e preços atemporais
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL, -- Starter, Professional, Enterprise
  price_per_seat decimal(10, 2) NOT NULL, -- Ex: 65.00
  tier_code varchar(50) UNIQUE NOT NULL, -- starter, pro, enterprise
  features jsonb DEFAULT '{}'::jsonb, -- Configurações de UI base
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. INSTITUTION SUBSCRIPTIONS
-- Vínculo matriz que atesta a "Conta" da faculdade.
CREATE TABLE IF NOT EXISTS institution_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  status varchar(50) DEFAULT 'active', -- active, past_due, canceled, suspended
  billing_cycle varchar(20) DEFAULT 'monthly', -- monthly, annual
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  licensed_students_count integer NOT NULL DEFAULT 0, -- Cota base assinada
  stripe_customer_id varchar(255),
  stripe_subscription_id varchar(255),
  asaas_customer_id varchar(255),
  asaas_subscription_id varchar(255),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criação de índice para otimizar busca de validação diária
CREATE INDEX IF NOT EXISTS idx_inst_subscriptions_status ON institution_subscriptions(institution_id, status);

-- 3. BILLING CYCLES
-- Cada ciclo vigente gera 1 registro. Usado para agrupar True-ups
CREATE TABLE IF NOT EXISTS billing_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES institution_subscriptions(id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status varchar(50) DEFAULT 'open', -- open, closed (fechado gera fatura)
  created_at timestamptz DEFAULT now()
);

-- 4. INVOICES
-- A Fatura ou Boleto físico a ser pago
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES institution_subscriptions(id),
  billing_cycle_id uuid REFERENCES billing_cycles(id),
  amount_due decimal(10, 2) NOT NULL,
  amount_paid decimal(10, 2) DEFAULT 0.00,
  status varchar(50) DEFAULT 'draft', -- draft, open, paid, uncollectible, void
  due_date timestamptz NOT NULL,
  paid_at timestamptz,
  invoice_url text, -- Link direto para visualização do PDF no Stripe/Asaas
  stripe_invoice_id varchar(255),
  asaas_invoice_id varchar(255),
  created_at timestamptz DEFAULT now()
);

-- 5. INVOICE ITEMS
-- Itens granulares da fatura (Ex: Licença Base + Licença Excedente)
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10, 2) NOT NULL,
  total_price decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 6. BILLING SNAPSHOTS
-- Fotografia gerada na virada do ciclo para auditoria de ROI
CREATE TABLE IF NOT EXISTS billing_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  billing_cycle_id uuid REFERENCES billing_cycles(id),
  snapshot_date timestamptz DEFAULT now(),
  licensed_students_count integer NOT NULL,
  active_students_count integer NOT NULL,
  total_hours_studied decimal(10, 2),
  total_invoice_amount decimal(10, 2),
  created_at timestamptz DEFAULT now()
);

-- 7. LICENSE USAGE
-- Medidor diário para disparar os alertas de Soft Block
CREATE TABLE IF NOT EXISTS license_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  record_date date DEFAULT current_date,
  students_registered integer NOT NULL,
  licensed_quota integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 8. FEATURE FLAGS
-- Liberação cirúrgica de recursos B2B por faculdade
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  has_roi_dashboard boolean DEFAULT false,
  has_heatmap boolean DEFAULT false,
  has_api_access boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) E BLINDAGEM B2B
-- ==============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- POLICIES: subscription_plans (Catálogo)
-- ------------------------------------------------------------------------------
-- Super Admin e Institution Admin podem ver. (Leitura pública autenticada)
CREATE POLICY "SuperAdmin_ALL_SubscriptionPlans" ON subscription_plans
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_SubscriptionPlans" ON subscription_plans
FOR SELECT USING (auth.jwt()->>'role' = 'institution_admin');

-- ------------------------------------------------------------------------------
-- POLICIES: institution_subscriptions
-- ------------------------------------------------------------------------------
CREATE POLICY "SuperAdmin_ALL_InstitutionSubscriptions" ON institution_subscriptions
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_InstitutionSubscriptions" ON institution_subscriptions
FOR SELECT USING (
  auth.jwt()->>'role' = 'institution_admin' AND 
  institution_id = (auth.jwt()->>'institution_id')::uuid
);

-- ------------------------------------------------------------------------------
-- POLICIES: billing_cycles
-- ------------------------------------------------------------------------------
CREATE POLICY "SuperAdmin_ALL_BillingCycles" ON billing_cycles
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_BillingCycles" ON billing_cycles
FOR SELECT USING (
  auth.jwt()->>'role' = 'institution_admin' AND 
  subscription_id IN (
    SELECT id FROM institution_subscriptions WHERE institution_id = (auth.jwt()->>'institution_id')::uuid
  )
);

-- ------------------------------------------------------------------------------
-- POLICIES: invoices
-- ------------------------------------------------------------------------------
CREATE POLICY "SuperAdmin_ALL_Invoices" ON invoices
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_Invoices" ON invoices
FOR SELECT USING (
  auth.jwt()->>'role' = 'institution_admin' AND 
  institution_id = (auth.jwt()->>'institution_id')::uuid
);

-- ------------------------------------------------------------------------------
-- POLICIES: invoice_items
-- ------------------------------------------------------------------------------
CREATE POLICY "SuperAdmin_ALL_InvoiceItems" ON invoice_items
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_InvoiceItems" ON invoice_items
FOR SELECT USING (
  auth.jwt()->>'role' = 'institution_admin' AND 
  invoice_id IN (
    SELECT id FROM invoices WHERE institution_id = (auth.jwt()->>'institution_id')::uuid
  )
);

-- ------------------------------------------------------------------------------
-- POLICIES: billing_snapshots
-- ------------------------------------------------------------------------------
CREATE POLICY "SuperAdmin_ALL_BillingSnapshots" ON billing_snapshots
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_BillingSnapshots" ON billing_snapshots
FOR SELECT USING (
  auth.jwt()->>'role' = 'institution_admin' AND 
  institution_id = (auth.jwt()->>'institution_id')::uuid
);

-- ------------------------------------------------------------------------------
-- POLICIES: license_usage
-- ------------------------------------------------------------------------------
CREATE POLICY "SuperAdmin_ALL_LicenseUsage" ON license_usage
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_LicenseUsage" ON license_usage
FOR SELECT USING (
  auth.jwt()->>'role' = 'institution_admin' AND 
  institution_id = (auth.jwt()->>'institution_id')::uuid
);

-- ------------------------------------------------------------------------------
-- POLICIES: feature_flags
-- ------------------------------------------------------------------------------
CREATE POLICY "SuperAdmin_ALL_FeatureFlags" ON feature_flags
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_FeatureFlags" ON feature_flags
FOR SELECT USING (
  auth.jwt()->>'role' = 'institution_admin' AND 
  institution_id = (auth.jwt()->>'institution_id')::uuid
);

