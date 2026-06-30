# FASE 8.18B.4 — AETERNUM-FIRST PUBLIC VIEWER BRANDING

## Objetivo
Remover a exposição pública da palavra e da marca "Sketchfab" na experiência do visualizador (cards da biblioteca, viewer, painel educacional, interações com IA e actions/menus) para todos os perfis (aluno, professor, coordenador, reitor e instituição). O Sketchfab continua operando normalmente no background como o motor técnico que renderiza e sustenta o 3D interativo público (a governança "Sketchfab-first" não foi alterada), porém, a partir de agora, o usuário percebe a interface integralmente como ambiente "Aeternum Atlas / Biblioteca Cadavérica Digital".

## O Que Foi Feito

1. **Catálogo & Cards de Biblioteca:**
   - Termo `SKETCHFAB 3D INTERATIVO` (que havia sido injetado na listagem visual dos modelos na base local e no serviço supabase) foi alterado globalmente para `MODELO 3D INTERATIVO`.
   
2. **Viewer Actions & Toolbar:**
   - O botão do menu de ações rápidas antes nomeado "Abrir no Sketchfab" (que abria um \_blank no provedor original) foi alterado para `"Visualizador 3D Aeternum"`, mantendo o tracking interno preservado.
   
3. **Painel Educacional (EducationalPanel):**
   - Fallbacks de UI: `"Não foi possível carregar as marcações do Sketchfab..."` alterado para usar "marcações do modelo".
   - Botões de ações: "Anotações Sketchfab" renomeados para "Anotações do Modelo".
   
4. **Tutor IA (AtlasAIViewerPanel & AtlasAIOrb):**
   - As strings hardcoded e prompts reativos (Ex: `"Estou conectado ao modelo Sketchfab..."` e `"Use as anotações do Sketchfab"`) foram migrados para `"Estou conectado ao modelo 3D aberto na Aeternum Atlas..."` e `"Use as anotações anatômicas do modelo"`, estabelecendo um branding pedagógico forte.
   
5. **Arquivos de Tradução (i18n):**
   - Auditamos as 4 línguas suportadas (`pt.js`, `en.js`, `es.js`, `de.js`) e purgamos mais de 30 ocorrências de referências verbais a "Sketchfab" (como `Modelo 3D hospedado no Sketchfab`) por "Modelo 3D hospedado na Biblioteca Cadavérica" ou "Visualizador externo".
   
6. **Variáveis Técnicas Intocadas:**
   - Como exigido por regra, hooks críticos como `isSketchfabMode`, variáveis da base como `sketchfabUid`, rotinas como `sketchfabAnnotationBridge`, referências de import e analytics events (ex: `open_external_sketchfab`) **não** sofreram nenhum _rename_, mantendo a fundação da engenharia estável e evitando re-render loop bugs.

## Validação de Critérios

- **Build Limpo:** Sim (0 chunk errors, 1035 modules transformed).
- **Sem Migrations:** Supabase e o banco de dados permaneceram inalterados.
- **Funcionamento Nativo:** Super Admins continuam possuindo a infraestrutura nativa isolada (via badges técnicos) internamente intacta, porém a interface pública de produção é totalmente *White Label / Aeternum*.
- **Sem Ocultação Ilegal:** A interface externa dentro do iFrame fornecida pelo Sketchfab continua com seu player original e sem bloqueio indevido de scripts (respeitando os Termos de Uso). 

## Conclusão
FASE 8.18B.4 finalizada. A marca Aeternum Atlas foi consolidada sem perder o motor de renderização da Fase 8.18B.3.
