# Aeternum 26 — restauração visual após integração de contas

Data: 2026-07-29  
Estado: **CONCLUÍDA**

## Contexto

A integração de seis contas reais alterou a seleção de experiências visuais. O
antigo modo de demonstração não reconhecia o novo estudante e o painel genérico
voltou a aparecer. A correção não reativou mocks: a linguagem visual aprovada
foi portada para os dados reais e para as rotas legítimas de cada papel.

## Alterações aplicadas

### Painel do aluno

- Hero premium restaurado com nome, curso, acesso institucional e progresso reais
- Identidade visual Liquid Glass preservada
- Cartões métricos reajustados para evitar que valores curtos quebrem em várias linhas
- Botões secundários normalizados para área mínima de 44 px
- Classe visual do estudante vinculada ao ciclo de vida da sessão real

### Painel do professor

- Estado vazio do modelo mais utilizado reduzido a um símbolo neutro
- Título reajustado para evitar escala excessiva
- Ações de seção e tabela normalizadas para 44 px

### Administração e superadministração

- Navegação duplicada removida do desktop
- Navegação horizontal preservada nos breakpoints compactos
- Toolbar de dados reais e seletor institucional receberam tratamento de vidro
- Seletor institucional normalizado para 44 px
- Rótulos visíveis com codificação corrompida foram corrigidos

### Coordenação e Reitoria

- Nenhuma intervenção estrutural foi necessária
- Composição premium existente preservada
- Responsividade recertificada

## Certificação

As seis contas reais foram abertas individualmente e medidas em:

- 1440 × 900
- 1366 × 768
- 768 × 1024
- 390 × 844

Resultado comum aos 24 cenários autenticados:

- zero overflow horizontal global
- zero controles visíveis abaixo de 44 px
- rota e título compatíveis com o papel autenticado

A página inicial pública também foi reinspecionada em desktop e celular, sem
overflow horizontal e sem controles visíveis abaixo de 44 px.

## Segurança e integridade

- Nenhuma senha ou token foi gravado em arquivo
- Nenhum usuário foi criado, excluído ou alterado
- Nenhuma tabela ou política do Supabase foi modificada
- Nenhum dado simulado foi reativado para substituir informação real
- Nenhum commit, push, reset ou checkout destrutivo foi executado
