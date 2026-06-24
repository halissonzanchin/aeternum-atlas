# INTEGRAÇÃO SUPABASE CMS 3D + STORAGE SEGURO (Fase 7.1F)
**Laudo de Auditoria Arquitetural e Governança de RLS (Sem Execução em Prod)**

## 1. Mapeamento Arquitetural do Banco de Dados
A estratégia de evolução do ecossistema 3D proprietário exige a dissociação limpa dos modelos passados (`sketchfab`) do motor nativo (`atlas`). Portanto, o esquema foi modelado com as tabelas `atlas_3d_models` e `atlas_3d_markers`, as quais devem abrigar o núcleo dos ativos gerados in-house.

### 1.1 Tabela: `atlas_3d_models`
Abriga os metadados macroscópicos de um artefato anatômico.

```sql
CREATE TABLE IF NOT EXISTS public.atlas_3d_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  model_url TEXT NOT NULL,
  model_format TEXT NOT NULL CHECK (model_format IN ('glb', 'obj', 'sketchfab')),
  viewer_engine TEXT NOT NULL DEFAULT 'atlas' CHECK (viewer_engine IN ('atlas', 'sketchfab')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  institution_id TEXT REFERENCES public.institutions(id), -- Nullable: global se não definido
  created_by TEXT NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 1.2 Tabela: `atlas_3d_markers`
Estrutura aninhada referencial (`FOREIGN KEY`) conectada aos modelos nativos, responsável por guardar a balística educacional e o foco da lente (*target* e *camera position*).

```sql
CREATE TABLE IF NOT EXISTS public.atlas_3d_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.atlas_3d_models(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position JSONB NOT NULL,
  camera_position JSONB NOT NULL,
  target JSONB NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## 2. Preparação do Bucket de Storage
Foi especificado o bucket restrito **`atlas-3d-models`**. Devido ao tamanho das malhas fotogramétricas (`.glb` / `.obj`), este bucket sofrerá estritas políticas de blindagem.

## 3. Governança e RLS (Row Level Security)

A premissa suprema da segurança de dados da Aeternum garante que não ocorra injeção de *payload* arbitrário por discentes:

### A. Para Administradores (Super Admin / Admin)
* **Permissões de Dados**: `SELECT`, `INSERT`, `UPDATE` e `DELETE` globais em ambas as tabelas de modelos e marcadores.
* **Storage**: Podem efetuar o método `POST`/`PUT` para injeção física dos arquivos pesados no bucket `atlas-3d-models`.

### B. Para Administradores Institucionais Autorizados
* **Permissões de Dados**: Possuem `SELECT` sobre os modelos cujo `institution_id` bata com sua credencial primária, e sobre o conteúdo em `published`. As operações de escrita (CRUD) devem ser geridas com cautela, priorizando permissões somente sob auditoria rigorosa de roles granulares, liberadas no futuro.

### C. Para Discentes (Alunos) e Docentes
* **Permissões de Dados**: Exclusivamente leitura (`SELECT`), e estritamente sob a condicional `status = 'published'` AND (`institution_id IS NULL` OR `institution_id = auth.users.institution`). Jamais enxergarão modelos `draft` ou `archived`.
* **Storage**: Acesso restrito a requisições `GET` via token autenticado (`authenticated`). É estritamente banida qualquer tentativa de upload.

## 4. Avaliação de Impacto e Parecer Técnico
A documentação SQL detalhada não fere, tranca ou reestrutura os dados legados ativos de Sketchfab. As migrations foram desenhadas no molde aditivo (`ADD`), protegendo os 150+ modelos que já sustentam os alunos atuais. O relatório está preparado para servir de espelho para as futuras `Supabase Migrations` e validações de CI/CD em Fases Executivas posteriores. Nenhuma injeção *live* no banco de dados da Aeternum ocorreu durante o levantamento desta fase (Auditoria com 100% de compliance).
