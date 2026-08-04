# Aeternum 26 — relatório de conclusão da Fase 0

Data: 2026-07-29  
Estado: **CONCLUÍDA**

## Decisão

A baseline técnica e visual está estável o suficiente para iniciar a próxima
fase do Aeternum 26. As seis contas provisionadas foram autenticadas
individualmente, suas interfaces foram observadas em navegador real e os quatro
viewports oficiais foram aprovados. O administrador institucional separado
continua fora do escopo porque nenhuma conta desse papel foi provisionada nesta
rodada.

## Entregas concluídas

1. Gate de lint funcional para JavaScript, JSX, TypeScript e TSX.
2. Quatorze erros reais de lint corrigidos sem refatoração expansiva.
3. Typecheck e build de produção aprovados.
4. Viewer 3D corrigido no desktop e validado nos quatro viewports oficiais.
5. Home, login, cadastro, painel do aluno, Modelos 3D e Viewer sem overflow
   horizontal.
6. Alvos interativos essenciais normalizados para 44 px ou mais.
7. Orçamento inicial de bundle e composição Liquid Glass registrado.
8. Matriz de certificação por papel criada com estados baseados apenas em
   evidência observável.
9. Painel premium do aluno portado do antigo modo de demonstração para os dados
   reais da nova conta, sem reativar métricas fictícias.
10. Professor, Coordenação, Reitoria, Administração e Superadministração
    autenticados e recertificados nos quatro viewports oficiais.
11. Navegação administrativa duplicada removida no desktop e preservada nos
    breakpoints compactos.
12. Rótulos administrativos com codificação corrompida corrigidos.

## Evidência responsiva

| Fluxo | 1536 × 864 | 1366 × 768 | 768 × 1024 | 390 × 844 |
|---|---:|---:|---:|---:|
| Home pública | Aprovado | Aprovado | Aprovado | Aprovado |
| Login | Aprovado | Aprovado | Aprovado | Aprovado |
| Cadastro | Aprovado | Aprovado | Aprovado | Aprovado |
| Painel do aluno | Aprovado | Aprovado | Aprovado | Aprovado |
| Modelos 3D | Aprovado | Aprovado | Aprovado | Aprovado |
| Viewer 3D | Aprovado | Aprovado | Aprovado | Aprovado |
| Painel do professor | Aprovado | Aprovado | Aprovado | Aprovado |
| Painel da coordenação | Aprovado | Aprovado | Aprovado | Aprovado |
| Painel da reitoria | Aprovado | Aprovado | Aprovado | Aprovado |
| Painel da administração | Aprovado | Aprovado | Aprovado | Aprovado |
| Painel da superadministração | Aprovado | Aprovado | Aprovado | Aprovado |

Dimensões finais do iframe do Viewer:

- desktop: 1386 × 720
- notebook: 1216 × 600
- tablet: 705 × 696
- celular: 344 × 523

O modelo anatômico foi observado visualmente, o iframe permaneceu conectado e
nenhum dos quatro viewports apresentou largura global excedente.

## Gates técnicos finais

- `npm run lint`: aprovado, 0 erros e 595 avisos de legado
- `npm run typecheck`: aprovado
- `npm run build`: aprovado
- `git diff --check`: deve permanecer limpo antes da consolidação compartilhada

## Débitos aceitos para as próximas fases

- reduzir os 595 avisos de legado de forma incremental
- dividir o bundle principal de 2,51 MB
- otimizar ou carregar sob demanda o SVG anatômico de 2,99 MB
- resolver `/assets/noise.png` no pipeline de build
- eliminar imports simultaneamente estáticos e dinâmicos
- medir LCP, INP, CLS e FPS em dispositivos físicos
- provisionar e certificar uma conta separada de administrador institucional,
  caso esse papel continue previsto no produto

## Regra de entrada na próxima fase

O rollout amplo de Liquid Glass pode avançar nas seis contas provisionadas. Uma
futura interface exclusiva de administrador institucional só entra no rollout
depois de receber conta legítima e repetir a mesma matriz de evidência.
