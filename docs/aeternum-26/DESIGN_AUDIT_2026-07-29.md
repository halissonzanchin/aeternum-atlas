# Aeternum 26 — auditoria geral de design

Data da auditoria: 2026-07-29  
Estado: **AUDITORIA CONCLUÍDA — ATUALIZAÇÃO GERAL AINDA NÃO INICIADA**

## Veredito executivo

A plataforma já possui uma direção visual reconhecível e alguns setores com
qualidade premium, especialmente a home pública, o painel inicial do aluno, o
shell autenticado e o Tutor Atlas AI. A base responsiva também está estável:
nas rotas e viewports amostrados não houve overflow horizontal global.

Entretanto, a aplicação ainda não opera como um único sistema de design. O
resultado atual combina três gerações de material translúcido, páginas antigas,
componentes genéricos e superfícies novas. O efeito não é de uma plataforma
deliberadamente refinada, mas de camadas visuais acumuladas.

O rollout amplo de Liquid Glass **não deve começar pela adição de mais blur**.
Deve começar pela correção dos contratos de navegação e dados e pela
consolidação de um único sistema material.

## Escopo e método

A auditoria foi executada em modo de evidência, sem alterar a interface:

- inspeção de rotas, componentes, folhas de estilo e contratos de navegação;
- autenticação individual das seis contas provisionadas;
- observação em navegador real da home, dashboards e rotas secundárias;
- amostragem responsiva em desktop e celular nesta rodada;
- cruzamento com a matriz de quatro viewports certificada na Fase 0;
- inspeção de controles visíveis, overflow, elementos com blur calculado e
  mensagens de console;
- verificação da origem de métricas apresentadas nos painéis de governança.

Foram verificadas mais de 60 combinações de rota e viewport. Nenhuma credencial
foi registrada neste documento.

## O que melhorou e deve ser preservado

### Home pública

- Hero com hierarquia forte, identidade anatômica própria e narrativa clara.
- Malha interativa e planetário criam uma assinatura visual reconhecível.
- CTAs principais possuem peso e contraste adequados.
- Zero overflow global e zero alvo visível abaixo de 44 px na amostra.
- A composição reduz de 13 elementos com blur no desktop para 6 no celular,
  indicando alguma degradação responsiva já implementada.

### Shell autenticado

- Marca, sidebar, topbar, busca e seletor de idioma formam uma estrutura comum.
- Os papéis possuem títulos e entradas de navegação específicas.
- O shell não apresentou overflow nas contas e viewports amostrados.
- A navegação administrativa duplicada foi removida no desktop durante a Fase 0.

### Aluno

- O painel inicial usa dados reais do perfil e preserva o layout premium.
- Hero, continuidade de estudo, métricas e recomendações têm boa hierarquia.
- O dashboard permaneceu íntegro em desktop, notebook, tablet e celular.

### Tutor Atlas AI

- A esfera viva e a conversa compartilhada já constituem uma assinatura de
  produto própria.
- O Tutor está disponível de forma global e utiliza um material mais avançado
  do que os cards antigos.
- A implementação inclui estados de movimento reduzido e painel morphing.

### Acessibilidade e adaptação

- Existem tratamentos para `prefers-reduced-motion`, transparência reduzida,
  contraste elevado e `forced-colors` nos sistemas mais novos.
- Dashboard, home, modelos e viewer já passaram pela matriz responsiva da Fase
  0 nos quatro viewports oficiais.

## Achados bloqueadores

### A26-P0-01 — menu e roteamento divergem em Coordenação

O menu oferece cinco módulos que levam a `Página não encontrada`:

- Professores;
- Turmas;
- Disciplinas;
- Heatmaps;
- Alunos em Risco.

Esse problema foi confirmado no navegador e no contrato de rotas. A interface
promete uma arquitetura de informação que a aplicação não entrega.

### A26-P0-02 — menu e roteamento divergem em Reitoria

O menu oferece quatro módulos que levam a `Página não encontrada`:

- Indicadores Institucionais;
- Engajamento;
- Utilização;
- ROI Acadêmico.

### A26-P0-03 — Digital Twins usa fallback silencioso

A rota administrativa `Digital Twins` não possui seção correspondente no
renderizador administrativo. Em vez de exibir erro ou estado “em construção”,
ela retorna silenciosamente à Visão geral. Isso cria falsa sensação de módulo
funcional.

### A26-P0-04 — dados estáticos aparecem como institucionais reais

Os painéis de Coordenação e Reitoria usam números, nomes, alertas, datas e o
rótulo “Universidad Privada del Este” fixos quando as contas reais não estão em
modo de demonstração. Isso é um problema de confiança e não apenas de conteúdo:
o acabamento visual transforma dados estáticos em indicadores aparentemente
oficiais.

As métricas devem ser conectadas a fonte real ou substituídas por estados vazios
honestos antes da certificação do novo design.

### A26-P0-05 — catálogo 3D apresenta falha de origem de dados

Durante a navegação autenticada, o console registrou repetidamente:

- bloqueio da consulta por `institution_id` ausente;
- falha ao carregar `models_3d`.

A página consegue apresentar estrutura visual e fallback, mas a experiência não
pode ser certificada como funcional enquanto a origem real falhar.

## Achados de alta prioridade

### A26-P1-01 — três sistemas materiais concorrem

O projeto carrega simultaneamente:

1. estilos globais históricos;
2. `CrystalGlassSystem`;
3. `AeternumOpticalGlass`.

Há elementos com classes das três famílias ao mesmo tempo. A topbar, por
exemplo, combina material liquid, crystal e optical. Isso multiplica bordas,
sombras, blur e especificidade e impede uma resposta óptica previsível.

Evidência estrutural:

| Indicador | Observado |
|---|---:|
| Folhas CSS | 25 |
| CSS fonte total | 599.517 bytes |
| Linhas em `globals.css` | 12.837 |
| Linhas em `CrystalGlassSystem.css` | 825 |
| Linhas em `AeternumOpticalGlass.css` | 1.751 |
| Ocorrências de `backdrop-filter` | 155 |
| Ocorrências de `!important` | 1.070 |
| Arquivos de componente com classes liquid brutas | 15 |
| Arquivos usando `AeternumGlassSurface` | 7 |

### A26-P1-02 — orçamento de blur é excedido

Contagem de elementos visíveis com `backdrop-filter` calculado:

| Superfície | Desktop | Celular |
|---|---:|---:|
| Home | 13 | 6 |
| Painel do aluno | 18 | 17 |
| Painel do professor | 19 | não recontado nesta rodada |
| Painel da coordenação | 19 | certificado na Fase 0 |
| Painel da reitoria | 14 | certificado na Fase 0 |
| Administração — visão geral | 20 | 19 |
| Administração — alunos | 32 | 31 |
| Administração — faturamento | 23 | certificado na Fase 0 |
| Administração — relatórios | 28 | 27 |

O orçamento já aprovado para Aeternum 26 é de até 6 superfícies com blur real
no desktop e até 4 em dispositivos compactos.

### A26-P1-03 — alvos interativos menores que 44 px

Foram confirmados:

- Atlas: 8 filtros de subcategoria com 32 px;
- Configurações: 7 abas com 37 px e encerrar sessão com 40 px;
- Agenda: navegação com 38 px e ações com 40 px;
- Simulados: 3 CTAs com 40 px;
- CMS de Modelos 3D: 6 filtros com 26 px;
- outros controles isolados em ROI, migração e certificação.

### A26-P1-04 — módulos genéricos quebram a hierarquia

Vídeos e Histórico repetem o título da página duas vezes. Vídeos, Cursos,
Histórico e Favoritos compartilham uma estrutura `SimpleModule`, visualmente
mais rasa e menos informativa do que o painel inicial e Modelos 3D.

### A26-P1-05 — configurações não respeitam o papel

Na conta de professor, Configurações apresenta “Perfil acadêmico — Estudante”.
O componente é visualmente reutilizado, mas o conteúdo não é contextualizado.

### A26-P1-06 — idioma e nomenclatura são inconsistentes

Há mistura entre português e inglês em superfícies institucionais:

- “Intervention Center”;
- “Student Risk Center”;
- “Migration Workbench”;
- “Certification Pipeline”;
- “Digital Twins”.

A mistura pode ser intencional para nomes de produto, mas hoje não existe uma
regra editorial que diferencie produto, módulo e conteúdo traduzível.

## Achados de média prioridade

### A26-P2-01 — excesso de densidade administrativa

Alunos, faturamento e relatórios acumulam grande quantidade de cards, métricas,
filtros e superfícies de vidro. Falta hierarquia progressiva: resumo, detalhe sob
demanda e ações contextuais.

### A26-P2-02 — estados vazios dominam o professor

O painel docente é coerente, porém muitas páginas são compostas quase
inteiramente por estados vazios. O design deve ensinar o próximo passo e não
apenas informar ausência de dados.

### A26-P2-03 — vocabulário visual não está normalizado

Há variações locais de:

- raios;
- sombras;
- bordas;
- opacidade;
- altura de controles;
- tipografia de títulos;
- resposta hover/press;
- intensidade do glow.

### A26-P2-04 — composição global do Tutor precisa de orçamento

O Tutor global aparece em todas as rotas privadas e utiliza canvas para a esfera.
A assinatura deve ser preservada, mas o renderer precisa ser único e pausado
quando invisível. O painel aberto pode receber material expressivo; o gatilho
compacto não deve criar uma nova pilha de blur em cada tela.

### A26-P2-05 — bundle e assets atrasam a percepção premium

Baseline recente da Fase 0:

- JavaScript principal: aproximadamente 2,50 MB sem gzip;
- CSS principal: aproximadamente 518 KB sem gzip;
- SVG anatômico principal: aproximadamente 2,99 MB;
- `/assets/noise.png` não resolvido no build;
- imports estáticos e dinâmicos concorrentes;
- chunk principal acima de 500 KB.

Liquid Glass com carregamento lento ou interação irregular deixa de parecer
premium, mesmo que os pixels estejam corretos.

## Matriz por papel

| Papel/superfície | Estado atual | Principal força | Principal risco |
|---|---|---|---|
| Home pública | forte | identidade própria e hero reconhecível | blur acima do orçamento |
| Aluno | misto/forte | dashboard premium com dados reais | módulos secundários genéricos e catálogo com erro |
| Professor | misto | shell e dashboard coerentes | estados vazios e contexto de perfil incorreto |
| Coordenador | bloqueado | dashboard institucional bem composto | cinco rotas quebradas e dados estáticos |
| Reitor | bloqueado | boa leitura executiva | quatro rotas quebradas e dados estáticos |
| Admin | misto | cobertura ampla de gestão | densidade, blur excessivo e filtros pequenos |
| Superadmin | misto | shell distinto e módulos reais compartilhados | mesmos débitos do Admin e Digital Twins falso |

## Confirmado, reportado, planejado e pendente

### Confirmado nesta auditoria

- seis contas autenticadas individualmente;
- home e dashboards responsivos sem overflow global;
- nove rotas de Coordenação/Reitoria quebradas;
- Digital Twins com fallback silencioso;
- dados estáticos em contas institucionais reais;
- alvos de 26 a 40 px em superfícies secundárias;
- múltiplos sistemas de vidro e excesso de blur;
- erro de origem do catálogo 3D no console.

### Confirmado na Fase 0

- build, typecheck e lint sem erros;
- quatro viewports aprovados nos fluxos de referência;
- viewer, home, login, cadastro e dashboards sem overflow;
- 595 avisos de lint legado permanecem.

### Planejado

- consolidação do sistema material;
- correção do contrato de navegação;
- componentes Aeternum 26;
- rollout por papel;
- recertificação de acessibilidade, responsividade e performance.

### Pendente de evidência

- Core Web Vitals em dispositivos físicos;
- FPS e custo de GPU em hardware modesto;
- contraste calculado de todos os estados;
- comportamento com transparência reduzida em todos os navegadores-alvo;
- integridade visual com dados institucionais reais populados;
- persistência e latência real do Tutor Atlas AI sob carga.

## Decisão de prontidão

**Prontidão visual para iniciar a fundação Aeternum 26: APROVADA.**  
**Prontidão para rollout geral de Liquid Glass: BLOQUEADA.**

O desbloqueio depende dos cinco itens P0. Somente depois deles a migração visual
deve avançar por ondas, conforme o plano de implementação.
