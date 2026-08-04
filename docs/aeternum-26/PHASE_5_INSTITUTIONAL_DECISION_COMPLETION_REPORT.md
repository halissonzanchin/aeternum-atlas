# Aeternum 26 — relatório de conclusão da Fase 5

Data: 2026-07-29  
Estado: **CONCLUÍDA**

## Resultado

A Coordenação e a Reitoria agora compartilham a fundação Aeternum 26, mas
possuem experiências decisórias distintas. A Coordenação prioriza operação
pedagógica; a Reitoria prioriza exceções, capacidade e integridade
institucional.

## Entregas concluídas

- experiência institucional única baseada em primitivas Aeternum 26;
- toolbar `Regular` com períodos de 7, 30 e 90 dias;
- origem, atualização e cobertura sempre identificáveis;
- métricas derivadas do período atual e comparação com período anterior;
- alertas ordenados por impacto e urgência;
- tabelas densas em material `Opaque`;
- drill-down contextual em modal `Substantial`;
- estados carregando, erro, restrito, parcial, vazio e observado;
- fontes acadêmicas de turmas, vínculos e disciplinas incluídas no contrato;
- filtros temporais aplicados também à distribuição por sistema e à utilização
  de modelos;
- fallback do tenant no shell sem mensagem enganosa de instituição ausente;
- contratos automatizados da Fase 5.

## Rotas entregues

### Coordenação

- `/coordinator/dashboard`;
- `/coordinator/professors`;
- `/coordinator/classes`;
- `/coordinator/disciplines`;
- `/coordinator/heatmaps`;
- `/coordinator/risk`.

### Reitoria

- `/rector/dashboard`;
- `/rector/indicators`;
- `/rector/engagement`;
- `/rector/utilization`;
- `/rector/roi`.

## Evidência com sessões reais

As contas legítimas de Coordenação e Reitoria chegaram às respectivas rotas
canônicas. Todas as onze rotas exibiram exatamente um título principal e
preservaram papel, rota e tenant.

A consulta institucional observada retornou uma linha de perfil visível e zero
linhas nas demais fontes acadêmicas disponíveis. A fonte
`academic_subjects` não respondeu. O produto apresenta esse resultado como
**leitura institucional parcial** e mostra a cobertura consultada. Nenhuma
turma, disciplina, atividade, capacidade ou resultado financeiro foi inventado.

O acesso direto da Coordenação a `/rector/dashboard` e da Reitoria a
`/coordinator/dashboard` resultou em **Acesso restrito**.

O drill-down foi aberto em `/coordinator/dashboard` e confirmou:

- uma única superfície de diálogo;
- scroll do documento bloqueado enquanto aberto;
- foco inicial no controle Fechar;
- rota preservada;
- foco devolvido ao acionador ao fechar.

## Certificação responsiva

| Papel | Desktop 1440 × 900 | Notebook 1366 × 768 | Tablet 768 × 1024 | Celular 390 × 844 |
|---|---:|---:|---:|---:|
| Coordenação | Validado | Validado | Validado | Validado |
| Reitoria | Validado | Validado | Validado | Validado |

Nos oito cenários:

- zero overflow horizontal global;
- exatamente um `h1`;
- zero controle visível abaixo de `44 × 44 px`;
- navegação correspondente ao breakpoint;
- fonte e papel identificáveis após a leitura do tenant.

As rotas representativas adicionais verificadas nos breakpoints foram
Mapas de aprendizagem no notebook, Turmas no tablet e celular, Engajamento no
tablet e Retorno institucional no celular.

## Validação automatizada

- `npm run test:contracts`: 34 testes aprovados, zero falha;
- `npm run test:a26-glass`: aprovado, zero nova declaração direta de blur;
- `npm run typecheck`: aprovado;
- ESLint dos arquivos da Fase 5: aprovado sem saída;
- `npm run lint`: zero erro e 583 avisos legados;
- `npm run build`: aprovado, 1.052 módulos transformados;
- `git diff --check`: aprovado; apenas avisos de normalização LF/CRLF no
  worktree compartilhado.

O build mantém avisos não bloqueantes sobre imports mistos e o chunk principal
de aproximadamente 2,55 MB. A redução desse custo permanece uma dívida de
performance e não foi mascarada como parte desta fase.

## Gates de saída

| Gate | Resultado |
|---|---|
| Todas as rotas do menu entregues | Aprovado |
| Zero dado fixo apresentado como real | Aprovado |
| Estados sem dados e dados parciais certificados | Aprovado |
| Coordenação e Reitoria distinguíveis por tarefa e densidade | Aprovado |
| Separação de permissões entre os dois papéis | Aprovado |
| Quatro viewports sem overflow e sem alvo subdimensionado | Aprovado |

## Débitos não bloqueantes

- criar ou restabelecer `academic_subjects` no backend para remover a fonte
  indisponível;
- ampliar a população real de turmas, vínculos e logs para validar tabelas com
  volume de produção;
- tratar o chunk principal do build em uma fase específica de performance.

Esses itens não alteram a honestidade do estado atual e não bloqueiam a saída da
Fase 5.

## Decisão

**Fase 5 concluída. A Fase 6 — Administração e Superadministração está
liberada.**
