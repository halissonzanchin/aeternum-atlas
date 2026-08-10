import fitz # PyMuPDF
import os

pdf_path = os.path.join(os.path.dirname(__file__), '../knowledge_base/pdf_books/Atlas de Anatomia Humana NETTER 6ed 2015_compressed.pdf')

if not os.path.exists(pdf_path):
    pdf_path = os.path.join(os.path.dirname(__file__), '../knowledge_base/pdf_books/Netter sin etiquetas_240813_220700.pdf')

doc = fitz.open(pdf_path)
print(f"Total de páginas no PDF: {len(doc)}")

for page_num in range(len(doc)):
    text = doc[page_num].get_text()
    if "fêmur" in text.lower() or "femur" in text.lower() or "miembro inferior" in text.lower() or "membro inferior" in text.lower():
        print(f"Página {page_num + 1}: Menção a Fêmur/Membro Inferior -> {text[:100].strip()}")
