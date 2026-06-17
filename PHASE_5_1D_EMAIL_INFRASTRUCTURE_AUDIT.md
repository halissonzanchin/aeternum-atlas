# EMAIL INFRASTRUCTURE ENTERPRISE AUDIT (Fase 5.1D)
**Estudo Arquitetural de Entregabilidade Massiva B2B**

Este documento avalia as principais provedoras de infraestrutura de e-mail transacional (SMTP/API) do mercado global, mapeando qual solução entregará a segurança técnica e a escalabilidade necessárias para suportar a Aeternum Atlas na sua expansão corporativa e acadêmica.

---

## 1. AUDITORIA DOS PROVEDORES (SMTP PROVIDERS)

### 1. Resend
A nova geração de e-mails para desenvolvedores.
* **Custo:** Grátis até 3.000/mês. ~US$ 20/mês para 50.000 envios.
* **Limites:** Cota escalável de forma simples, com limites flexíveis de *Rate Limit*.
* **Entregabilidade:** Altíssima. IPs superaquecidos e limpos.
* **Integração com Supabase:** **Nativa/Imediata.** O ecossistema moderno recomenda Resend fortemente com integrações prontas em 1 clique ou via credenciais SMTP simples.
* **Curva de Implantação:** Extremamente baixa (Pronto em 15 minutos).

### 2. Amazon SES (Simple Email Service)
A espinha dorsal barata da internet.
* **Custo:** Praticamente nulo. US$ 0,10 a cada 1.000 envios. (US$ 5 para 50.000 envios).
* **Limites:** Conta nova entra em *Sandbox* restrito (200 e-mails por dia). Exige abertura de ticket rigoroso na AWS para sair da Sandbox (podendo liberar +50.000/dia).
* **Entregabilidade:** Alta, porém dependente da reputação da conta ao longo do tempo (exige política rígida de controle de *Bounces*).
* **Integração com Supabase:** Via credenciais SMTP da AWS geradas no IAM. Relativamente simples no painel.
* **Curva de Implantação:** Alta. O painel da AWS é arcaico e exige conhecimento robusto de IAM, Políticas JSON e DNS.

### 3. SendGrid (Twilio)
O provedor padrão legado para SaaS (*Enterprise Standard*).
* **Custo:** US$ 19,95/mês para 50.000 e-mails.
* **Limites:** Escalabilidade virtualmente ilimitada para contas pagas.
* **Entregabilidade:** Variável. Contas sem IP Dedicado (planos baratos) costumam cair em "IPs Sujos" que geram caixas de Spam em universidades rígidas. IP Dedicado custa extra (>$89/mês).
* **Integração com Supabase:** Via SMTP genérico.
* **Curva de Implantação:** Média.

### 4. Mailgun
* **Custo:** ~US$ 35/mês (Plano Foundation, 50k emails).
* **Limites:** Ilimitado via pagamento extra.
* **Entregabilidade:** Muito boa, mas assim como o SendGrid, o plano base sofre de IP Compartilhado.
* **Integração com Supabase:** Via SMTP.
* **Curva de Implantação:** Média.

---

## 2. COMPARATIVO ENTERPRISE (SIMULAÇÕES)

| Cenário de Onboarding Simultâneo | Resend | Amazon SES | SendGrid | Mailgun |
| :--- | :--- | :--- | :--- | :--- |
| **500 Alunos (Pequena)** | Excelente (Suporta no free-tier) | Falha (Se estiver na Sandbox) | Excelente | Excelente |
| **2.000 Alunos (Média)** | Excelente | Excelente (Pós-sandbox) | Excelente | Excelente |
| **10.000 Alunos (Grande)** | Excelente ($20/mo) | Excelente ($1.00) | Risco de Spam (Sem IP Dedicado) | Muito Bom |
| **50.000 Alunos (Multi-Instituição)** | Excelente | Imbatível em Custo ($5.00) | Requer IP Dedicado ($89/mo) | Muito Bom ($35) |

**Respostas Executivas:**
1. **Qual oferece melhor custo-benefício hoje?** **Resend**. Pelo limite gratuito generoso e pela ausência de dor de cabeça em aquecimento de IP.
2. **Qual oferece maior escalabilidade bruta?** **Amazon SES**. É a infraestrutura raiz.
3. **Qual exige menos manutenção técnica?** **Resend**.
4. **Qual é mais indicado para a fase atual da Aeternum Atlas?** **Resend**. O SaaS necessita de agilidade para os primeiros clientes com entregabilidade garantida sem tickets longos com suportes.
5. **Qual seria indicado para a fase de expansão latino-americana (Centenas de milhares)?** **Amazon SES**. Uma vez consolidada, migra-se a rota para AWS pelo custo irrisório.

---

## 3. AUDITORIA DE SEGURANÇA E DOMÍNIO

Nunca se utiliza o domínio raiz corporativo para envios massivos de convite. Se uma universidade denunciar 5.000 e-mails como Spam acidentalmente, todo o tráfego corporativo e de suporte da Aeternum (diretoria, marketing) vai para a "Lista Negra" (Blacklist).

* **`aeternumatlas.com`**: Não indicado (Risco de queima do domínio raiz).
* **`app.aeternumatlas.com`**: Não indicado (Domínio que hospeda a aplicação web, pode ser barrado por firewalls restritos universitários se queimar).
* **`auth.aeternumatlas.com` ou `mail.aeternumatlas.com`**: **RECOMENDADO.**

### Exigências Técnicas para o Domínio (`mail.aeternumatlas.com`):
1. **SPF (Sender Policy Framework):** **Obrigatório**. Autoriza o Resend/AWS a enviar mensagens em nome deste subdomínio.
2. **DKIM (DomainKeys Identified Mail):** **Obrigatório**. Criptografa o cabeçalho confirmando que a mensagem não foi adulterada.
3. **DMARC:** **Obrigatório**. Regras de blindagem contra Phishing. Universidades Federais descartam e-mails que não tenham DMARC rígido (`p=quarantine` ou `p=reject`).

---

## 4. CLASSIFICAÇÃO FINAL E RECOMENDAÇÃO

### Melhor Solução para Hoje (Lançamento e Tração)
🏆 **RESEND**
Integra-se ao Supabase em minutos, tem o painel mais limpo da atualidade e garante os primeiros meses gratuitos.

### Melhor Solução para Daqui 3 Anos (Maturidade)
🏆 **AMAZON SES**
Quando a plataforma possuir engenheiros de DevOps focados, migrar as credenciais SMTP no Supabase do Resend para a AWS derrubará a conta mensal de comunicação a centavos.

### Melhor Solução para 100.000 Usuários
🏆 **AMAZON SES** (com IP Dedicado)

### RECOMENDAÇÃO DEFINITIVA
Nesta fase da Aeternum Atlas, onde a Engenharia precisa ter foco na robustez da conversão e nos simulados médicos, fugir do labirinto burocrático da AWS é mandatório.

**Abra uma conta gratuita no Resend**, gere uma chave de API, cadastre no seu DNS os registros TXT para o subdomínio `mail.aeternumatlas.com`, e adicione essas credenciais na área "Auth > SMTP" do Supabase. Essa ação durará 15 minutos e habilitará o envio seguro, automático e validado de convites para mais de 3.000 alunos mensais com garantia de não caírem no Spam de universidades.
