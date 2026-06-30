# FASE 8.18B.2R — SKETCHFAB-FIRST VIEWER GOVERNANCE RESET

## Objetivo Principal
Desvincular o Atlas Native Engine da experiência de usuários comuns (aluno, professor, coordenador, reitor e conta institucional), tornando o Sketchfab Embed a fonte exclusiva para consumo educacional publicado, incluindo o Viewer 3D, Anotações, Guia de Estudo, Simulado Prático e Tutor IA.

O Atlas Native Engine foi preservado como tecnologia interna (laboratório), acessível exclusivamente pelo perfil **Super Admin**.

## Resumo Técnico do que foi Feito

1. **Viewer Engine Service (`viewerEngineService.js`)**:
   - Ajustada a função `shouldUseSketchfabEngine` para agora aceitar e verificar o perfil do usuário (`user`). 
   - Foi implementada a trava que obriga todos os usuários que não sejam Super Admins a usarem o Sketchfab (desde que o embed URL seja válido), ignorando por completo qualquer tentativa de forçar via `?engine=native`.

2. **Atlas AI Tutor (`AtlasAIViewerPanel.jsx`)**:
   - Atualizamos a mensagem de boas-vindas para focar em "modelo anatômico digital 3D Interativo", abolindo o discurso prévio de que Sketchfab era "temporário" na visão do estudante. O Tutor está sintonizado contextualmente com o Sketchfab para o aluno.

3. **Painel Educacional (`EducationalPanel.jsx`)**:
   - Retirada menção direta ao "Atlas Native Engine" da tela de erro (quando anotações falhavam ao carregar) para não induzir o aluno a buscar um modo que não está acessível.

4. **Modelos Locais & Serviço de Modelos (`localModels.js` & `modelService.js`)**:
   - Modificamos a string de exibição (`type`) na listagem da biblioteca. De `Atlas Native / Escaneamento Anatômico Real` para `SKETCHFAB 3D INTERATIVO`, correspondendo à nova estratégia de catálogo para os três principais arquivos experimentais publicados.

5. **Interface de Cartão (`ModelCard.jsx`)**:
   - A tag responsiva visual mobile que forçava "ATLAS NATIVE" foi substituída por "MODELO 3D", padronizando a exibição visual para que perfis institucionais não visualizem resquícios da arquitetura nativa experimental.

6. **Viewer Controls & Toolbar (`ViewerPage.jsx` & `RightToolbar.jsx` & `ViewerControls.jsx`)**:
   - Repassamos a flag do usuário logado na árvore de componentes até a `RightToolbar`.
   - Omitimos condicionalmente o botão que força o redirecionamento/engine mode "Atlas Native Engine" no painel da direita, de modo que alunos e professores nunca vejam essa opção (aparecendo apenas para Super Admins).
   - O parâmetro `user` agora alimenta diretamente o hook que determina a engine `isSketchfabMode`.

## Confirmações de Critérios de Aceite

* **Native Engine Preservado**: ✅ Nenhum componente, GLB, modelLodManifest ou hook nativo foi apagado. O Super Admin mantém total acesso.
* **Sketchfab Padrão para Comuns**: ✅ A engine força retorno para Sketchfab a menos que a rota seja acessada por quem detém flag real de Super Admin.
* **Super Admin Mantém Preview**: ✅ O parâmetro da query `?engine=native` continua funcional condicionado ao `isSuperAdmin`.
* **Tutor IA Reajustado**: ✅ Interface adaptada e comunicando o motor correto sem confusões na visão pública. O backend já extraía o contexto via SketchfabBridge em publicações Embed.
* **Build Limpo**: ✅ Compilação do React+Vite ocorreu de primeira, sem gerar quebras de chunk ou dependência cíclica, tempo total: 12.29s.
* **Banco de Dados Preservado**: ✅ O Supabase e o schema não sofreram nenhuma alteração; nenhuma migration foi executada, obedecendo ao protocolo conservador (somente lógicas frontend).

## Arquivos Alterados (Git)

- `src/services/viewerEngineService.js`
- `src/features/viewer/ViewerPage.jsx`
- `src/data/localModels.js`
- `src/services/modelService.js`
- `src/components/ModelCard/ModelCard.jsx`
- `src/components/RightToolbar/RightToolbar.jsx`
- `src/features/viewer/ViewerControls.jsx`
- `src/features/atlas-viewer/ai/AtlasAIViewerPanel.jsx`
- `src/features/viewer/components/EducationalPanel.jsx`

## Conclusão
FASE 8.18B.2R finalizada com absoluto sucesso. O Viewer agora está seguro para consumo e livre de anomalias nativas em contas públicas.
