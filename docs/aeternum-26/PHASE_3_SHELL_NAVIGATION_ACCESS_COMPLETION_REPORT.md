# Aeternum 26 — relatório de conclusão da Fase 3

Data: 2026-07-29  
Estado: **CONCLUÍDA**

## Resultado

A moldura compartilhada da plataforma foi substituída por um shell único,
responsivo e governado pelos contratos Aeternum 26. A navegação, o papel e a
rota agora são derivados da mesma fonte canônica para Aluno, Professor,
Coordenação, Reitoria, Administração institucional e Superadministração.

## Entregas concluídas

### Shell autenticado

- sidebar Regular única em desktop e notebook;
- topbar Regular com papel, rota e instituição;
- tab bar Clear em tablet e celular;
- menu móvel completo em modal Substantial;
- item ativo com `aria-current="page"`;
- navegação administrativa redundante removida em todos os breakpoints;
- conteúdo isolado em região rolável sem overflow horizontal.

### Busca, idioma e menus

- busca contextual expansível pelo atalho `/`;
- resultados limitados às rotas autorizadas do papel;
- limpeza e retorno ao campo com `Escape`;
- seletor de idioma com menu semântico;
- suporte a `ArrowUp`, `ArrowDown`, `Home`, `End` e `Escape`;
- notificações com estado vazio honesto;
- popovers de conta e notificação com fechamento por teclado;
- modal com ciclo de Tab, restauração de foco e bloqueio do scroll.

### Acesso público e autenticação

- header e footer da home migrados para Aeternum 26;
- login e cadastro migrados para cards e fields opacos;
- idioma, login e cadastro permanecem disponíveis no celular;
- redirecionamento de cadastro usa a home canônica do papel;
- bootstrap, erro global, rota ausente e permissão negada usam estados A26;
- estados de acesso declaram rota e papel em atributos auditáveis;
- corrida entre login interativo e restauração inicial de sessão eliminada por
  um epoch de autenticação, sem relaxamento de permissão.

### Ergonomia do Tutor IA

O Tutor IA permanecia sobre o quarto item da tab bar no celular. A posição
inicial agora respeita a área reservada à navegação. Nos viewers em que a esfera
é arrastável, o primeiro posicionamento também considera essa área, mas o
usuário continua livre para movê-la por toda a viewport.

## Evidência de acesso real

Nenhuma senha ou token foi registrado neste relatório.

| Papel | Papel observado | Home canônica observada | Rota ativa | Resultado |
|---|---|---|---:|---|
| Aluno | `student` | `/student/home` | 1 | Aprovado |
| Professor | `teacher` | `/professor/dashboard` | 1 | Aprovado |
| Coordenação | `coordinator` | `/coordinator/dashboard` | 1 | Aprovado |
| Reitoria | `rector` | `/rector/dashboard` | 1 | Aprovado |
| Administração institucional | `institution_admin` | `/institution/dashboard` | 1 | Aprovado |
| Superadministração | `super_admin` | `/super-admin` | 1 | Aprovado |

O primeiro ciclo automatizado expôs a corrida de restauração da sessão. Após a
correção, as seis contas chegaram às suas rotas canônicas sem overflow.

## Matriz responsiva do shell

| Formato | Viewport | Sidebar | Tab bar | Overflow | Controles abaixo de 44 px | Blurs estruturais |
|---|---:|---:|---:|---:|---:|---:|
| Desktop | 1440 × 900 | Sim | Não | 0 | 0 | 2 |
| Notebook | 1366 × 768 | Sim | Não | 0 | 0 | 2 |
| Tablet | 768 × 1024 | Não | Sim | 0 | 0 | 2 |
| Celular | 390 × 844 | Não | Sim | 0 | 0 | 2 |

Com o menu móvel aberto:

- blur estrutural ativo: 1;
- foco inicial: botão Fechar;
- `Shift+Tab` no primeiro controle: retornou ao último controle;
- `Escape`: fechou o modal, liberou o scroll e devolveu foco a `Mais`.

## Evidência pública e de formulário

- home header/footer: zero overflow nos quatro viewports;
- login: zero overflow e zero controle efetivo abaixo de 44 px;
- cadastro: zero overflow e zero controle efetivo abaixo de 44 px;
- checkbox de termos usa label com hit area superior a 44 px;
- seletor de idioma mantém foco e ordem de setas;
- menu público móvel exibe idioma, Entrar e Registrar-se simultaneamente.

## Contratos automáticos

O teste `a26-shell-contracts.test.mjs` cobre:

- papel, rota e item ativo;
- homes canônicas do Professor;
- busca e navegação móvel;
- orçamento de blur e remoção de blur direto;
- migração de home, login, cadastro e acesso;
- teclado, foco e bloqueio de scroll;
- proteção contra restauração de sessão obsoleta.

Comandos obrigatórios:

- `npm run test:contracts`;
- `npm run test:a26-glass`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run build`.

## Passivos não bloqueantes

- o lint permanece sem erros, mas o repositório ainda contém avisos legados;
- o build ainda informa asset de noise resolvido em runtime, imports mistos e
  bundle principal acima de 500 kB;
- módulos de conteúdo genéricos permanecem para a Fase 4;
- o shell não altera nem simula dados institucionais.

## Gate de saída

- navegação completa por teclado: aprovado;
- zero sobreposição entre Tutor IA e navegação inicial: aprovado;
- zero overflow horizontal nos quatro viewports: aprovado;
- até dois blurs estruturais no shell: aprovado;
- rota e papel identificáveis: aprovado;
- seis papéis autenticados em homes canônicas: aprovado;
- contrato contra regressão publicado: aprovado.

**Decisão: Fase 3 concluída. A Fase 4 está liberada.**
