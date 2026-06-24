# ANATOMICAL CONTENT PIPELINE AUDIT (Fase 7.0A)
**Laudo Estratégico de Cadeia Produtiva 3D (Aeternum Atlas)**

## 1. O Pipeline Completo de Produção (10 Etapas)

**ETAPA 1 — Origem da Peça:**
* **Como chega:** Via doação legal para a universidade parceira ou morgue institucional, rigorosamente regida por termos de consentimento prévio para ensino.
* **Quem autoriza:** Comitê de Ética da universidade e a chefia do laboratório de morfologia.
* **Riscos Legais e Éticos:** Altíssimos. Falha na anonimização cadavérica pode incorrer em infração gravíssima. A captura não pode expor marcas reconhecíveis (tatuagens, rostos) e deve ser blindada sob fins estritamente acadêmicos.

**ETAPA 2 — Dissecção:**
* **Equipe:** 1 Professor de Anatomia Sênior (Prosector), 1 Auxiliar.
* **Tempo Médio:** 4 a 12 horas (dependendo da complexidade do plano facial/vascular).
* **Estruturas de Maior Valor:** Neuroanatomia (Tronco encefálico, Base do Crânio), Plexos Nervosos (Braquial, Lombossacral) e Vias Cardiovasculares Profundas. Peças musculares densas geram menos WOW factor B2B.

**ETAPA 3 — Fotogrametria:**
* **Equipamentos:** Câmera DSLR *Full Frame* com lente Macro/50mm, mesa giratória automatizada, e iluminação circular (Ring Lights + Softboxes) com polarização cruzada para matar o brilho úmido (glare) do tecido biológico.
* **Quantidade/Resolução Ideal:** 150 a 300 fotos por peça, gravadas em RAW.
* **Gargalos:** Reflexo dos fluidos corporais (gordura e formol) que confundem o algoritmo de alinhamento 3D.

**ETAPA 4 — Processamento Computacional:**
* **Ferramenta Ouro:** *RealityCapture* (Epic Games).
* **Tempo Médio:** 1 a 3 horas de tempo de máquina (exigindo GPU poderosa como RTX 4090 e alta RAM).
* **Pontos Críticos:** Falha no alinhamento de fotos obrigando o reinício da captura, gerando uma malha ("mesh") deformada.

**ETAPA 5 — Limpeza e Otimização:**
* **Ferramentas:** *Blender*, *ZBrush*, *MeshLab*.
* **Esforço Técnico:** Remoção da mesa, fechamento de buracos, e redução de polígonos (*decimation*) de 10 milhões de faces para cerca de 100.000 a 300.000, essencial para carregar no navegador web do aluno. Custo de mão de obra 3D especializado intensivo.

**ETAPA 6 — Texturização:**
* **O Padrão Aeternum:** Utilizar a cor real da carne (Diffuse/Albedo), criando mapas de Normal e Roughness (rugosidade) no Blender para devolver o "aspecto orgânico" sem onerar o carregamento.

**ETAPA 7 — Publicação (Cloud 3D):**
* **Meio Atual:** *Sketchfab Enterprise*. (Alternativa futura: Three.js/WebGL próprio hospedado na AWS).
* **Tempo/Gargalos:** Rápido (15 mins), porém altamente dependente do limite de tamanho do arquivo e do processamento nativo da plataforma terceira.

**ETAPA 8 — Catalogação e Metadados:**
* **Padrão Ideal:** Nomenclatura Anatômica Internacional.
* Exemplo: *ID: skull_base*, *Nome: Base do Crânio*, *Tags: [neurocranio, forame, sela turcica]*.

**ETAPA 9 — Integração Atlas AI (Nascimento do RAG):**
* **O que nasce junto com o modelo:** O Dicionário RAG (JSON). Cada peça escaneada obriga a criação de um laudo textual com a *descrição topográfica*, a *relevância clínica* (Ex: lesão aqui gera paralisia do par X), e 5 *perguntas de simulado* acopladas. Sem isso, o AI Tutor é cego.

**ETAPA 10 — Publicação Final no Frontend:**
* Inserção do `ID` da malha no banco de dados Supabase e liberação da peçca para o currículo da universidade.

---

## 2. Capacidade Operacional e Diagnóstico

1. **Volume Mensal Atual:** 4 a 8 modelos impecáveis (assumindo equipe enxuta).
2. **Gargalo Principal:** A Dissecção. Requer um mestre de anatomia, que tem agenda lotada, sendo um processo artesanal lento.
3. **Gargalo Secundário:** Tratamento 3D (Retopologia) para redução pesada da malha visando rodar em tablets sem perder beleza.
4. **Dependência Humana Crítica:** O *Prosector* (O cirurgião/professor que faz a limpeza fina da peça).
5. **Dependência Tecnológica Crítica:** O Algoritmo de Fotogrametria e Placa de Vídeo Local de alto custo.
6. **Custo Estimado por Modelo:** R$ 500 a R$ 1.500 (Somando horas técnicas de médicos e artistas 3D + licenciamento de software).
7. **Tempo Médio:** 2 a 3 dias úteis por peça completa do início ao fim.
8. **Como escalar 10x:** Padronizar laboratórios múltiplos. Transferir o "Polo de Dissecção" para o cliente; a Aeternum apenas recebe fotos via nuvem e faz o processamento computacional em massa via granja de servidores (*Render Farm*).
9. **Como Escalar B2B:** Criar a "Bolsa Aeternum". Fechar contrato com universidades para que elas façam a dissecção fotográfica nas próprias aulas em troca de desconto no SaaS. O conteúdo passa a ser descentralizado.
10. **Roadmap 12 Meses:**
    - Mês 1-3: Processo interno centralizado e manual (Criar os top 30 modelos essenciais).
    - Mês 4-6: Criação de *Scripts* de automação Blender para limpar peças em 5 minutos.
    - Mês 7-12: Plataforma SaaS de *Upload* de Fotos; as próprias instituições enviam as fotos do necrotério e a plataforma Aeternum devolve o modelo web renderizado em 2 horas.

---

## 3. Estratégia Comercial: A Batalha de Novembro (Demo UPE)

**Se a reunião da UPE ocorrer em novembro:**
* **Modelos Prontos Necessários:** 10 a 15 modelos de Altíssima Prioridade. Não precisamos do corpo inteiro. Precisamos das peças que reprovam alunos.
* **Prioridade Máxima (As "Reprovadoras"):**
  1. Base do Crânio (Pela complexidade de forames).
  2. Plexo Braquial e Lombossacral (Dificuldade de visualização 3D na cabeça do aluno).
  3. Coração com valvas abertas e Sistema de Condução.
  4. Tronco Encefálico e Ventrículos (Neuroanatomia).
* **Efeito WOW:** O Cérebro dissecado revelando os núcleos da base internamente. É impossível de ver no papel, difícil no formol e avassalador graficamente na tela.
