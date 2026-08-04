# Aeternum 26 — orçamento inicial de performance e composição

Data do baseline: 2026-07-29

Este documento estabelece limites de engenharia para a futura aplicação do
Liquid Glass. Os números de bundle são de build; métricas de Core Web Vitals
ainda precisam ser coletadas em dispositivos reais.

## Baseline observado

| Indicador | Baseline |
|---|---:|
| Bundle JavaScript principal, sem gzip | 2.509,63 kB |
| Bundle JavaScript principal, gzip | 696,64 kB |
| CSS principal, sem gzip | 516,63 kB |
| CSS principal, gzip | 93,94 kB |
| SVG anatômico principal, sem gzip | 2.993,66 kB |
| Logo SVG, sem gzip | 200,64 kB |
| Superfícies com `backdrop-filter` no painel do aluno | 23 |
| Superfícies com `backdrop-filter` em Modelos 3D | 26 |
| Superfícies com `backdrop-filter` no Viewer | 14 |

## Limites Aeternum 26

### Composição visual

- No máximo 6 superfícies com blur real simultâneo no desktop
- No máximo 4 superfícies com blur real simultâneo em tablet e celular
- Zero blur real aninhado
- Cards de conteúdo persistente usam material opaco ou translúcido sem blur
- Blur expressivo reservado para navegação, Tutor, menus e modais transitórios
- Animações contínuas devem usar preferencialmente `transform` e `opacity`
- `prefers-reduced-motion` e `prefers-reduced-transparency` são gates obrigatórios

### Bundle

- Nenhum asset individual acima de 1 MB sem justificativa e carregamento tardio
- Separar o Viewer 3D e painéis administrativos do bundle inicial
- Meta intermediária do bundle inicial JavaScript: menor que 1,2 MB sem gzip
- Meta intermediária do CSS inicial: menor que 300 kB sem gzip
- Resolver imports simultaneamente estáticos e dinâmicos antes da certificação

### Experiência

- LCP planejado menor que 2,5 s
- INP planejado menor que 200 ms
- CLS planejado menor que 0,1
- Nenhum overflow horizontal global nos quatro viewports oficiais
- Interações animadas com meta de 60 fps e degradação controlada em hardware modesto

## Gates para a próxima fase

- Relatório de bundle reproduzível
- Rotas públicas e autenticadas divididas em chunks funcionais
- Asset anatômico otimizado ou carregado sob demanda
- Contagem automática de superfícies com blur por rota de referência
- Comparação desktop/notebook/tablet/celular em equipamento real
