# ATLAS GLB OPTIMIZATION PIPELINE

## Por que OBJ é ruim para Web?
Modelos `.obj` são arquivos salvos em formato de texto (ASCII). Para o motor 3D carregar um OBJ na Web, o navegador precisa converter milhões de linhas de texto (ex: `v 1.23 4.56 7.89`) em arrays binários de números no Javascript. 
Esse processo de *parsing* ocorre na *Main Thread* (a linha de processamento principal), causando congelamento completo da interface (o navegador trava), consumo astronômico de memória RAM e tempos de carregamento muitas vezes superiores a 3 minutos para modelos acima de 200MB. Além disso, OBJ não armazena configurações ricas de PBR (materiais modernos), agrupamento ou animação nativa num único arquivo de forma eficiente.

## Por que GLB é o formato Oficial?
O `.glb` (glTF Binary) é o "JPEG do 3D". Trata-se de um formato binário projetado especificamente para a Web e tempo real. O navegador consegue enviar os dados binários quase diretamente para a GPU (Placa de Vídeo) com o mínimo de processamento de CPU. Ele embute texturas, malhas, materiais PBR e nós organizacionais em um único arquivo de tamanho reduzido e carregamento extremamente veloz.

No Atlas Aeternum, o formato oficial de visualização é o GLB. OBJs brutos devem ser usados apenas como entrada bruta de sistema, e nunca expostos ao Viewer final do aluno.

## Diferença de Compressões GLB

1. **GLB Bruto:** Formato GLB exportado diretamente de um software de 3D (Blender/Maya). Embora seja melhor que o OBJ, arquivos gigantes (ex: 500MB) ainda sobrecarregarão a banda de internet do médico/aluno.
2. **GLB Draco:** Usa compressão desenvolvida pelo Google (Draco) especificamente para dados geométricos (vértices e triângulos). Pode reduzir o peso geométrico em até 90%. O tempo de download é minúsculo, mas o tempo de *descompressão na CPU* do navegador pode causar um pequeno delay (engasgo) antes de renderizar na tela.
3. **GLB Meshopt:** Outra compressão geométrica de altíssima velocidade. Diferente do Draco, o Meshopt foca na **velocidade extrema de descompressão** usando WebAssembly/SIMD nativo da GPU. O arquivo final pode ser levemente maior que o Draco, mas ele decodifica instaneamente, ideal para interatividade na Web.
4. **GLB com KTX2 (Basis Universal):** Compressão voltada para *Texturas* (imagens). Texturas normais (PNG/JPEG) precisam ser totalmente descompactadas na memória RAM da placa de vídeo (VRAM). O KTX2 permite que as imagens fiquem comprimidas mesmo dentro da Placa de Vídeo, impedindo que o navegador estoure a memória de vídeo em dispositivos móveis ou notebooks básicos.

### Draco vs Meshopt: Qual a recomendação oficial?
Na Aeternum Atlas, priorizamos a **fluidez de navegação**:
- **Modelos Estáticos Anatômicos Pesados:** `Meshopt` preferencial. A descompressão quase instantânea previne que a interface congele quando o médico trocar de um órgão para outro.
- **Compatibilidade Ampla (Padrão de Indústria):** `Draco` aceitável. Recomendado caso a ferramenta de exportação do artista 3D só possua integração com Draco.
- **Texturas Grandes (4K/8K):** Deve-se sempre preparar suporte futuro ao `KTX2`.

## Fluxo Recomendado de Otimização
Qualquer modelo pesado que entrar na plataforma deve passar pelo seguinte pipeline antes de ir para produção:
1. **Validação:** Verificar integridade do arquivo.
2. **Limpeza e Conversão:** Remover dados inúteis (pontos isolados) e converter de OBJ para GLB bruto.
3. **Redução Poligonal (Opcional):** Reduzir número de triângulos se o detalhe microscópico não for vital (`gltf-transform simplify`).
4. **Compressão (Draco/Meshopt):** Comprimir os vértices da malha (`gltf-transform draco`).
5. **Otimização de Textura:** Reduzir tamanhos para resolução máxima 2K ou 4K e aplicar WebP/KTX2.
6. **Upload Final:** Subir para a nuvem da Aeternum (Supabase Storage).

## Limites Recomendados e Checklist
- **Notebook/Mobile de entrada:** Abaixo de 50MB (ideal), máx 100MB.
- **Notebook robusto/Alta fidelidade:** 100MB a 300MB.
- **Aviso crítico (+500MB):** Deve ser fatiado em sistemas isolados ou usar forte redução de LODs antes de exportar.

### Checklist pré-upload:
- [ ] O arquivo é .glb?
- [ ] Possui Draco ou Meshopt aplicado?
- [ ] Texturas desnecessariamente pesadas foram comprimidas?
- [ ] Normais flipadas corrigidas?
- [ ] Escala nativa está correta?

## BVH Raycast Acceleration (Fase 8.4D)
**O que é BVH?**
BVH (*Bounding Volume Hierarchy*) é uma estrutura de dados de árvore que divide espacialmente os triângulos de um modelo 3D. 

**Por que melhora o raycasting?**
Sem BVH, quando o usuário clica com o mouse na tela para adicionar um marcador anatômico, o WebGL (Three.js) precisa testar uma linha reta invisível contra **cada um dos milhões de triângulos** do modelo anatômico um por um. Isso trava o navegador por segundos a cada clique.
Com BVH, os triângulos são agrupados em caixas virtuais. Se o clique não atingir a "caixa mestre", o motor ignora instantaneamente milhões de triângulos, focando apenas nos poucos triângulos contidos na subdivisão exata do clique. O cálculo cai de `O(N)` para `O(log N)`, passando de segundos para milissegundos.

**Impacto em Modelos Grandes:**
O custo de usar BVH é apenas um leve processamento na CPU no momento de carregamento inicial (alguns milissegundos a mais). Em troca, ganhamos interatividade absoluta. Modelos de centenas de megabytes podem ser clicados, pintados ou fatiados instantaneamente sem que a tela trave (lag). Todo modelo carregado pelo Atlas Native Viewer já passa automaticamente pelo construtor de BVH.

## Atlas LOD Manager (Fase 8.4E)
**O que é LOD?**
LOD (*Level of Detail*) é uma técnica de otimização onde versões diferentes do mesmo modelo 3D (com diferentes quantidades de polígonos) são trocadas dinamicamente com base na distância da câmera ou na capacidade do dispositivo (Hardware).

**Por que é necessário?**
O corpo humano completo pode possuir 20 milhões de triângulos. Renderizar isso no nível celular quando a câmera está vendo o corpo inteiro de longe é um desperdício massivo de placa de vídeo. Com LOD, o corpo pode ser renderizado com 50.000 polígonos (LOW) de longe, 500.000 (MEDIUM) de perto, e 20 milhões (HIGH) apenas quando o médico aplicar um ultra-zoom microscópico.

**Geração dos Níveis (Pipeline de Exportação):**
1. O artista/curador deve gerar três arquivos `.glb` separados a partir do modelo principal (ex: usando decimation no Blender ou `gltf-transform simplify`).
2. **REGRA CRÍTICA (Alinhamento Espacial):** Todas as 3 versões (Low, Medium, High) **precisam** ter exatamente a mesma Escala, mesma Posição Global (Origem `0,0,0`) e mesma Rotação.
3. Se os arquivos divergirem na origem espacial, as *Annotations* (Marcadores Anatômicos) salvos no banco de dados da Aeternum ficarão flutuando fora do lugar quando o nível de detalhe for trocado.

**Validação de Alinhamento e LOD Manifest:**
Ao cadastrar um modelo gigantesco no banco de dados, em vez de subir 1 arquivo, o curador cadastrará o *LOD Manifest* (um mapa contendo as 3 URLs e as distâncias de transição recomendadas). O LOD Manager do Atlas calculará ativamente a distância da lente da câmera até o centro do modelo, trocando as URLs no cache do Three.js de forma indolor e sem recarregar a página (graças ao React Suspense Transition).
