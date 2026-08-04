# Inventário Supabase: Views, RPCS, Functions e Storage

- **Views Inventariadas:**
  - Nenhuma exposta globalmente identificada nas migrations recentes.
- **Materialized Views:**
  - Nenhuma identificada.
- **Functions / RPCS Expostas:**
  - `private.current_user_role()` (Usa `auth.jwt() ->> 'role'` e resolve a hierarchy)
  - `private.current_user_status()`
  - `private.current_user_institution_id()`
  - Todas as 3 funções privadas acima **não são executáveis publicamente**, pois o schema `private` foi desenhado estritamente para ser acessado por Policies.
  - Funções `security definer`: Inexistentes no path público acessível pelo cliente final, bloqueando escalação de privilégio ou contorno de escopo institucional.
- **Storage / Buckets:**
  - `atlas-assets`: Bucket central. Possui RLS ("Admin full access to assets", "Institutional read for assets of published models"). Não foi testado o download direto. Bloqueado pelo ambiente sem UI.
- **Tabelas Críticas (Status de Avaliação):**
  - **Usuários (`public.users`)**: Inventariado (4 policies). Leitura testada.
  - **Instituições (`public.institutions`)**: Inventariado (1 policy). Leitura não testada.
  - **Estudantes / Professores / Turmas (`academic_class_students`, etc)**: Inventariadas. Não testadas (cross-tenant em academic_classes permanece pendente).
  - **Modelos 3D (`public.models_3d`)**: Inventariado e Testado (JWT SQL Test).
  - **Licenças e Analytics**: Inventariadas as tabelas. Dados simulados no frontend via mock.

### Bypass do Super Admin

A autorização global do `super_admin` ocorre de forma legal e explícita dentro da cláusula `USING` das Policies (e.g. `(current_user_role() = 'super_admin')`).
- Foi confirmado que o frontend não contém requisições emitidas com a chave de serviço (`service_role`). Todas as requisições autenticadas usam a anon key combinada com o JWT de usuário.
- O claim que determina o acesso é extraído diretamente da rotina `private.current_user_role()`, garantindo o bypass seguro de controle RLS no PostgreSQL (não contorno do RLS, mas sim cumprimento das regras).
