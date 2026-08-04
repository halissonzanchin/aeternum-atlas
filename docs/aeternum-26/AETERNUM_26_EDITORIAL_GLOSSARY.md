# Aeternum 26 — glossário editorial e contrato de verdade

Data: 2026-07-29  
Estado: **ATIVO — FASE 1**

## Objetivo

Este documento define o vocabulário oficial da interface em português e as
regras mínimas para que um rótulo, métrica ou estado não prometa uma
funcionalidade ou uma origem de dados inexistente.

## Nomes oficiais

| Conceito | Forma oficial | Evitar |
|---|---|---|
| Produto | Aeternum Atlas | Aeternum atlas, Atlas Aeternum |
| Assistente | Atlas AI Tutor | Tutor IA genérico, Siri |
| Biblioteca tridimensional | Modelos 3D | 3D Models, Modelos tridimensionais |
| Atlas de referência | Atlas Anatômico | Atlas anatômico digital |
| Área administrativa global | Superadministração | Super Admin, Superadministrador |
| Área administrativa institucional | Administração | Admin institucional |
| Área de coordenação | Coordenação | Coordenador |
| Área executiva | Reitoria | Reitor |
| Recurso futuro | Gêmeos digitais | Digital Twins |

Nomes próprios de tecnologias e serviços externos permanecem na grafia
registrada pelo fornecedor.

## Papéis

| Identificador técnico | Rótulo visível |
|---|---|
| `student` | Aluno |
| `teacher` | Professor |
| `coordinator` | Coordenação |
| `rector` | Reitoria |
| `institution_admin` | Administração |
| `admin` | Administração (alias legado de `institution_admin`) |
| `super_admin` | Superadministração |

O identificador técnico nunca deve aparecer como título de uma área ou como
descrição de perfil.

## Estados de produto

- **Disponível:** fluxo funcional, acessível ao papel atual e validado.
- **Planejado:** contrato reconhecido, ainda sem operação funcional.
- **Em demonstração:** conteúdo ou dado sintético claramente rotulado.
- **Sem dados:** consulta concluída sem registros para o escopo autorizado.
- **Dados parciais:** apenas parte das fontes esperadas respondeu.
- **Indisponível:** dependência funcional falhou ou está temporariamente fora.
- **Sem permissão:** sessão válida, mas o papel não autoriza o recurso.
- **Contexto institucional ausente:** conta sem vínculo institucional
  necessário para a consulta.
- **Referência local:** conteúdo curado no código, não proveniente do catálogo
  institucional.

## Origem e atualização de dados

Toda métrica institucional deve ter uma origem reconhecível:

- **Supabase / dados institucionais:** consulta real sob as políticas de acesso;
- **Referência local:** catálogo embarcado e explicitamente identificado;
- **Demonstração:** valores sintéticos, sempre rotulados no mesmo bloco visual;
- **Não conectado:** contrato de dados ainda não implementado.

Não usar “em tempo real”, “oficial”, “ativo”, “disponível” ou “sincronizado”
sem evidência observável que sustente o termo. Valores ausentes usam `—`; nunca
usar `0` para mascarar falha, ausência de escopo ou contrato não conectado.

## Navegação e títulos

1. O item de menu e o título da página usam o mesmo substantivo.
2. Uma rota não pode cair silenciosamente em “Visão geral”.
3. O título descreve a tarefa atual, não apenas o papel do usuário.
4. Inglês não deve aparecer na interface em português quando houver forma
   oficial neste glossário.
5. A capitalização padrão é sentence case, exceto nomes próprios e siglas.

## Mensagens de estado

Uma mensagem deve informar, nesta ordem:

1. o que ocorreu;
2. se o conteúdo foi preservado;
3. qual ação segura o usuário pode executar;
4. quando aplicável, qual dependência ou permissão está ausente.

Evitar mensagens que atribuam sucesso a uma operação não confirmada ou que
exponham detalhes técnicos, identificadores internos ou credenciais.

## Contrato de revisão

Novos rótulos compartilhados devem entrar primeiro no arquivo de traduções e
seguir este glossário. Toda nova área deve demonstrar:

- rota válida;
- título esperado;
- estado vazio;
- estado de erro;
- origem dos dados;
- política de acesso por papel.
