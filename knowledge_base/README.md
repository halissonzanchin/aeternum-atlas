# 📚 Base de Conhecimento de Livros Médicos & Anatomia (Aeternum Atlas AI Tutor)

Esta pasta é o repositório local de arquivos **PDF** e materiais acadêmicos que servem como fonte de alimentação bibliográfica para o **Atlas AI Tutor**.

---

## 📁 Estrutura de Pastas

```text
knowledge_base/
├── README.md               <-- Este guia explicativo
├── pdf_books/              <-- COLOQUE SEUS ARQUIVOS PDF AQUI!
│   ├── Moore_Anatomia_Orientada_Clinica.pdf
│   ├── Grays_Anatomia_para_Estudantes.pdf
│   ├── Netter_Atlas_de_Anatomia_Humana.pdf
│   └── Sobotta_Atlas_de_Anatomia.pdf
└── ingested_chunks/        <-- (Gerado automaticamente) Trechos extraídos e vetorizados
```

---

## 🚀 Como Alimentar o Tutor IA

1. **Adicione os Livros:** Copie seus arquivos `.pdf` diretamente para a pasta `knowledge_base/pdf_books/`.
2. **Execute o Script de Ingestão:** No terminal da raiz do projeto, execute:
   ```bash
   node tools/scripts/ingest_anatomy_books.js
   ```
3. **Processamento Automático:**
   - O script lerá os PDFs linha a linha e os dividirá em capítulos e trechos conceituais.
   - Gerará vetores de IA (Embeddings).
   - Enviará o conhecimento médico diretamente para o seu banco de dados **Supabase** (`anatomical_knowledge_base`).

> ℹ️ **Nota:** Arquivos `.pdf` grandes nesta pasta são automaticamente ignorados pelo Git (via `.gitignore`) para não sobrecarregar o repositório GitHub, mantendo-os seguros e acessíveis localmente na sua máquina.
