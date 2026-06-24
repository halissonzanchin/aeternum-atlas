# ADMIN CMS 3D: ESTRUTURA DE CADASTRO E MARCADORES (Fase 7.1E)
**Laudo de Arquitetura da Área Administrativa Proprietária**

## 1. Contexto e Demanda
A evolução do *Atlas Viewer Engine* para um visualizador flexível (Fase 7.1D) gerou a necessidade imediata de uma retaguarda administrativa (Backoffice). A Aeternum Atlas, detendo modelos autorais, não pode mais depender das submissões opacas de estúdios externos como ocorria no Sketchfab. A Fase 7.1E inaugura o *Content Management System* (CMS) tridimensional, permitindo controle cirúrgico sobre metadados e ancoragem anatômica.

## 2. Inserção Limpa no Ecosistema
Em vez de erguer um portal paralelo e oneroso, optamos pela inserção nativa na `AdminExecutivePage` da Aeternum.
* **Rota Adicionada:** `/admin/models-3d` acoplada às `aliases` institucionais, protegida pelos mesmos Middlewares do painel de controle executivo (SuperAdmin e Institution Admin).
* **Ausência de Efeitos Colaterais:** A adição não alterou tabelas Supabase preexistentes e garantiu a não-intrusão no visualizador legado dos alunos.

## 3. Gestão Local de Contrato (Mock)
A arquitetura do banco futuro foi desenhada no arquivo `admin3DModels.mock.js`. Diferente de uma entrada de banco comum, um modelo 3D Aeternum carrega balística (Câmera e Alvo).
O modelo `female-reproductive-sagittal` foi estipulado com arrays aninhados de Marcadores:
```javascript
markers: [
  {
    id: "marker-1",
    title: "Útero",
    position: [0, 1, 0], // Coordenada de contato do pino na malha
    cameraPosition: [2, 2, 4], // Posição de repouso da lente
    target: [0, 0, 0] // Vetor de olhar central
  }
]
```

## 4. Sub-Componentização do CMS
O painel foi subdividido em camadas funcionais sob `src/features/admin-3d/`:
1. **`Admin3DModelsPage.jsx`**: O regente estadual (*State Manager*). Coordena a lista esq/dir, despacha Toasts de salvamento falso e manipula a RAM do navegador.
2. **`Admin3DModelForm.jsx`**: Formulário rígido. Altera as chaves mestras (`viewer_engine`, `model_format`) com lógica protetiva (bloquear formato se engine for *sketchfab*).
3. **`Admin3DMarkersEditor.jsx`**: CRUD aninhado e complexo. Desempacota strings em vetores tridimensionais limpos via `parseArrayInput`, permitindo adição imediata de novos alvos anatômicos.

## 5. Saldo Operacional
A Aeternum Atlas possui agora o front-end integral para despachar seu conteúdo próprio. O sistema valida nativamente e apresenta visual de luxo consistente com as dashboards institucionais. O Build (`npm run build`) validou as conexões do Vite. O próximo gargalo a ser rompido (em fases subsequentes) será apenas a ponte assíncrona entre o "Salvar" desta tela e as *Buckets* do Supabase Storage.
