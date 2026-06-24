# Atlas Cadaveric Scan Upload QA Pipeline (Fase 8.4J)

## Introdução
A proposta visual da **Aeternum Atlas** depende de fotogrametria cadavérica de altíssima definição. No entanto, arquivos sem otimização prévia no Blender ou MeshLab podem ultrapassar centenas de megabytes. Para mitigar o travamento do *Viewer* (no lado do aluno), foi introduzido o **QA Pipeline** como uma barreira diagnóstica e preventiva administrativa.

## Fluxo de Qualidade no Admin (CMS)
Assim que um ativo `.glb` ou `.obj` entra no sistema de Storage (Supabase), o administrador visualizará o **Atlas Asset QA Panel** ativo logo abaixo dos campos de arquivo 3D no formulário.

O pipeline de análise executará as seguintes validações:

### 1. Formato de Arquivo (OBJ vs GLB)
A plataforma prefere o carregamento binário de geometria e texturas acopladas (.glb).
- Se o formato for `.obj`: O pipeline assinalará `needs_optimization` e subtrairá `50 pontos` do score final.
- *Justificativa:* OBJs são ineficientes e não portam as compressões Meshopt/Draco nativamente na leitura remota.

### 2. Escalada de Tamanho (Megabytes)
A malha importada deve respeitar faixas de risco:
- **< 50 MB:** Risco verde (`approved`). Score penalizado em 0.
- **50MB – 200MB:** Risco laranja (`pending_review` ou `needs_optimization` dependendo do peso). Score sofre perda de 10 a 20 pontos. Exige-se decimação ou compactação forte nas texturas.
- **> 200MB – 500MB:** Risco vermelho (`needs_optimization`). Computadores de entrada e celulares não possuem VRAM suficiente para alocar dezenas de milhões de polígonos texturizados. Score sofre penalidade severa (-40).
- **> 500MB:** `rejected` ou `needs_optimization` crônico. Inviável em WebGL estrito sem um algoritmo LOD multi-part severo.

### 3. Resultados da Extração e Avisos Visuais
- **Not_Checked:** O botão para executar a inspeção fica disponível.
- **Approved / Pending Review:** O administrador pode seguir e mudar o `Status` para Publicado/Active sem alertas da interface.
- **Needs_Optimization / Rejected:** O CMS bloqueia ativamente o administrador visualmente: O *Dropdown* de Status de publicação ficará vermelho e apresentará textos de perigo exigindo que o arquivo permaneça em **Draft** (Rascunho) até a equipe modeladora reenviar um GLB decimation adequado.

## Fase Atual (8.4K - Atlas Asset Publication Gate)
Na Fase 8.4K, acoplamos um serviço validador estrito (`validateAssetPublicationGate`) que lê o relatório do QA e emite uma barreira imutável no CMS:

### Regras de Bloqueio (O que NÃO pode ser Publicado)
1. Ausência de arquivo 3D na nuvem (Storage Vazio).
2. `qaStatus` em "Rejected" (Ex: malha não reconhecida, erro na leitura).
3. `qaStatus` em "Needs Optimization" (Ex: Malhas maiores que 500MB).
4. Extensão raiz sendo `.obj` bruto em vez de `.glb` binário.

### Comportamentos por Hierarquia
- **Admin Global:** Jamais conseguirá marcar o Status como "Publicado" ou "Ativo" se a malha colidir com os critérios de bloqueio acima. O CMS forçará ativamente que a malha continue salva como **Rascunho (Draft)** para o desenvolvimento sem estourar o client-side do aluno.
- **Super Admin (Fundador):** A ele é concedida uma chave Mestra. Ao ser notificado do bloqueio crítico, a UI apresenta o botão "Forçar Publicação". Ele aciona um modal punitivo de 2 Fatores onde o administrador é instado a confirmar sua intenção (digitando **PUBLICAR MESMO ASSIM**). Isso anota a evasão localmente com rastreio autoral (`publication_override`) e libera o arquivo nocivo.
