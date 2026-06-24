# DEMO DAY STRESS TEST AUDIT (Fase 6.5B)
**Mapeamento de Riscos e Matriz de Contingência (UPE)**

## 1. Login Institucional
* **Riscos:** Falha na camada de autenticação, timeout do Supabase Auth, bloqueio de rede corporativa.
* **Plano de Contingência:** Manter o ambiente logado e cacheados em duas abas anônimas antes do início da reunião. Caso a rede bloqueie chamadas de API, ignorar a tela de login e apresentar diretamente os painéis previamente abertos via Mock Layer.

## 2. Viewer 3D (O Maior Risco)
* **Riscos:** API do Sketchfab fora do ar, restrições extremas de firewall na UPE derrubando pacotes WebGL, placa de vídeo engasgando.
* **Plano de Contingência:** Gravação prévia de segurança. Manter vídeos curtos em MP4 da manipulação 3D ("Base do Crânio") salvos localmente. Se o Viewer não renderizar em 5 segundos, minimizar a aba fluidamente e dar play no vídeo local dizendo: "Como o WiFi institucional está bloqueando WebGL, vou demonstrar em altíssima fluidez via gravação direta da plataforma".

## 3. Atlas AI Tutor
* **Riscos:** Erro visual de colapso de CSS do modal, falha no evento do botão.
* **Plano de Contingência:** O Atlas AI é apenas um Mock estático nesta fase. Se o botão não responder por erro de renderização, ignorar a execução e narrar a intenção: "Aqui, o aluno teria acionado nosso Atlas AI para receber a prescrição clínica." Sem desculpas e sem quebras dramáticas.

## 4. Dashboards (Reitor/Professor/Aluno)
* **Riscos:** A variável de ambiente `VITE_DEMO_MODE=upe` não ser lida ou os dados Mock falharem, gerando gráficos vazios.
* **Plano de Contingência:** Como os dados são puramente estáticos injetados via JS `studentMock.js`, o risco técnico de *downtime* é quase zero. Se acontecer, carregar capturas de telas (Screenshots) em altíssima resolução de todos os painéis, previamente mantidas abertas num visualizador genérico.

## 5. Internet & Wi-Fi Institucional
* **Riscos:** Internet a menos de 5 Mbps, perda de conexão na hora de rotear.
* **Plano de Contingência:** Nunca confiar na rede de visitantes da faculdade. Levar um Roteador 4G/5G móvel exclusivo (Hotspot) ou usar ancoragem do celular primário conectando diretamente via cabo USB.

## 6. Hardware & Kit Mínimo
* **Riscos:** Notebook principal descarregar ou travar por atualização do Windows.
* **Kit Mínimo (Checklist):**
  - [ ] Notebook Principal (Carregado a 100%, com atualizações automáticas paradas).
  - [ ] iPad/Tablet Secundário (Como espelho de gravação).
  - [ ] Modem 4G Portátil / Plano de Dados Ilimitado.
  - [ ] Adaptadores HDMI / Tipo-C Universais.
  - [ ] Apresentador Laser / Passador de Slides.

## 7. Flexibilidade do Roteiro
* **Pontos Críticos Intocáveis:** Dashboard do Aluno e o cálculo financeiro do Reitor (14.000 horas).
* **Partes Puláveis (Time-Box):** O Atlas AI pode ser resumido. O painel da Coordenação pode ser pulado para pular direto ao ROI do Reitor se o tempo encurtar.
* **Ordem Alternativa:** Se o Diretor Financeiro for o tomador de decisão da sala, inverter: Começar pelo Reitor (ROI de 250k) e usar o Aluno (Lucas Almeida) apenas como justificativa técnica do porquê o sistema gerou aquela economia.

---
**Severidade do Mapeamento:**
- **Riscos Críticos:** Queda do Viewer 3D WebGL via firewall acadêmico.
- **Riscos Moderados:** Queda de sinal Wi-Fi.
- **Riscos Baixos:** Queda do Banco de Dados Mock (é local, impossível cair).

**Probabilidade de Sucesso após Mitigação:** 99%. A adoção da "Redundância Dupla" (App Live + Vídeos Locais de Backup) garante que a narrativa comercial jamais seja interrompida pela mecânica de TI.
