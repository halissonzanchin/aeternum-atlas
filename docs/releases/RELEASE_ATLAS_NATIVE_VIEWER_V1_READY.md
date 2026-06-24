# RELEASE: ATLAS NATIVE VIEWER V1 READY

**Data da Release:** 23 de Junho de 2026
**Status Final:** READY
**Tag Oficial:** `v0.8.4-native-viewer-ready`

## Resumo do Motor 3D Nativo
O Atlas Native Viewer consolida a independência tecnológica da Aeternum Atlas, substituindo visualizadores de terceiros por um motor WebGL proprietário focado no ensino médico avançado. Ele suporta renderização fotorealista de scans cadavéricos, ferramentas precisas de manipulação (órbita, pan, zoom) e marcações anatômicas. O fluxo foi blindado através de um rigoroso QA Pipeline e de uma Barreira de Publicação (Publication Gate), garantindo integridade clínica e de performance.

## Fases Concluídas (Ciclo 8.4)
- **FASE 8.4A:** Fundações do Viewer
- **FASE 8.4B:** GLB Optimization Pipeline
- **FASE 8.4C:** Runtime Decoder Hardening (Draco/Meshopt)
- **FASE 8.4D:** BVH Raycast Acceleration
- **FASE 8.4E:** LOD Manager Foundation
- **FASE 8.4F:** Sketchfab-like Cadaveric Scan Viewer Refocus
- **FASE 8.4G:** Camera Fly-To Marker Engine
- **FASE 8.4G.2:** Orbit Controls Recovery
- **FASE 8.4H:** Photorealistic Cadaveric Scan Rendering
- **FASE 8.4H.1:** Rendering QA Validation
- **FASE 8.4I:** Viewer UX Professional Edition
- **FASE 8.4J:** Cadaveric Scan Upload QA Pipeline
- **FASE 8.4K:** Atlas Asset Publication Gate
- **FASE 8.4L:** Cadaveric Scan Production Readiness
- **FASE 8.4M:** Vercel Deployment & Browser GPU Validation
- **FASE 8.4N:** Production Baseline Lock & Release Tag

## Módulos Aprovados
* Atlas Native Viewer
* GLB Runtime Loader
* OBJ fallback administrativo
* Draco/Meshopt readiness
* BVH Raycast Acceleration
* LOD Manager Foundation
* Orbit/Zoom/Pan
* Camera Fly-To
* Marker System
* Editor Visual 3D
* Photorealistic Cadaveric Rendering
* Viewer UX Professional Edition
* Upload QA Pipeline
* Publication Gate
* Admin Global Governance
* Super Admin Governance
* Vercel Deployment
* Supabase connection

## Recursos Disponíveis
* Upload e parsing de arquivos `.glb` e `.obj`.
* Painel de Diagnóstico de QA (Status, Score, Alertas e Recomendações).
* Gate de Publicação (com bloqueio para arquivos irregulares ou grandes demais).
* Overrides por Super Admin.
* Visualização fotorealista de modelos 3D com iluminação otimizada e texturas mapeadas.
* Interatividade guiada por marcadores anatômicos (Fly-To).

## Limitações Conhecidas
* O status **READY** foi validado com deploy em Vercel, porém usando modelos de teste.
* Modelos anatômicos **reais** (scans de alto peso) entrarão para teste oficial apenas na FASE 8.5.
* Otimização automática pesada via backend (conversão/compressão no servidor) ainda não foi implementada.
* **GLB** otimizado com compressão Draco/Meshopt é o formato estrito recomendado para produção.
* **OBJ** é aceito, mas restrito apenas como entrada em uso administrativo (não otimizado).
* Testes em múltiplos dispositivos mobile deverão ser ampliados posteriormente.
* A performance final (FPS/memória) no lado do aluno dependerá intrinsecamente do peso real do scan anatômico publicado.

## Ambiente de Produção
* **URL de Produção Vercel:** [https://aeternum-atlas.vercel.app](https://aeternum-atlas.vercel.app)
* **Supabase Project Utilizado:** `hyivyrictgjdazgizafp` (Aeternum Atlas Original)

## Critérios de Validação Aplicados
A aprovação do sistema seguiu validações híbridas:
1. Avaliação Arquitetural Estática de Componentes e Policies (QA & Publication Gate).
2. Validação Funcional Local (React e WebGL).
3. Validação de Build e Deploy na Nuvem (Vercel).
4. GPU Rendering Testing (Testes visuais reais de órbita e Fly-To no navegador em rede remota).

## Segurança Pós-Release (Checklist de Status Atual)
- [x] A chave `SUPABASE_SERVICE_ROLE_KEY` **não** está presente no frontend da Vercel.
- [x] A chave `OPENAI_API_KEY` **não** está presente no frontend da Vercel.
- [x] Apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão acessíveis publicamente no dashboard do Vercel.
- [x] Rotas de administração (incluindo painéis do Publication Gate) exigem autenticação do Supabase validada.
- [x] Admin Global possui governança administrativa regular (mas é bloqueado de ignorar o QA negativo).
- [x] Super Admin/Founder detém governança máxima (bypass de bloqueios do QA).
- *Recomendação: Efetuar rotatividade de senha da conta root/superadmin caso sessões debug tenham ocorrido.*

## Rollback Note
Caso a entrada na FASE 8.5 (ou ciclos subsequentes) comprometa a estabilidade do sistema, siga estas instruções de rollback:
* **Commit Atual:** `27d55935bc30d411934eb766dd22cacba8b6f7d9`
* **Branch Atual:** (Base do repositório antes do ciclo 8.5)
* **Tag/Release:** `v0.8.4-native-viewer-ready`
* **Deploy Vercel Associado:** Deploy produtivo linkado à Tag/Commit.
* **Instrução de Rollback Técnico:** Para voltar ao código estável localmente e forçar novo deploy, utilize os seguintes comandos no terminal Git local:
  ```bash
  git checkout v0.8.4-native-viewer-ready
  git checkout -b fix/rollback-8.4
  git push origin fix/rollback-8.4
  # Após push, efetue o Deploy manual na Vercel a partir dessa branch.
  ```

## Próximos Passos
Congelamento desta versão completado. A transição imediata deverá ser para a **FASE 8.5 — PRIMEIRO MODELO ANATÔMICO REAL OTIMIZADO**, onde validaremos toda a estrutura construída utilizando uma peça de scan bruto de escala real.
