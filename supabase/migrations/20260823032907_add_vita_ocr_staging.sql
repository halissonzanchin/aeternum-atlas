-- AETERNUM VITA - estágio privado e auditável para OCR de páginas anatômicas.
-- Esta tabela não integra a Atlas IA e não é acessível por clientes públicos.

CREATE TABLE IF NOT EXISTS public.vita_ocr_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_title TEXT NOT NULL CHECK (char_length(book_title) BETWEEN 1 AND 500),
  source_file TEXT NOT NULL CHECK (char_length(source_file) BETWEEN 1 AND 500),
  source_sha256 TEXT NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
  page_number INTEGER NOT NULL CHECK (page_number > 0),
  source_image_sha256 TEXT NOT NULL CHECK (source_image_sha256 ~ '^[0-9a-f]{64}$'),
  page_width_pixels INTEGER NOT NULL CHECK (page_width_pixels > 0),
  page_height_pixels INTEGER NOT NULL CHECK (page_height_pixels > 0),
  dpi INTEGER NOT NULL CHECK (dpi BETWEEN 150 AND 600),
  language_codes TEXT[] NOT NULL DEFAULT ARRAY['eng']::TEXT[],
  page_kind TEXT NOT NULL DEFAULT 'unknown'
    CHECK (page_kind IN ('scanned-text', 'sparse-labels', 'mixed', 'unlabeled-plate', 'unknown')),
  extraction_method TEXT NOT NULL DEFAULT 'tesseract-tsv'
    CHECK (extraction_method IN ('tesseract-tsv', 'digital-text', 'manual-review')),
  ocr_text TEXT NOT NULL DEFAULT '' CHECK (char_length(ocr_text) <= 200000),
  mean_confidence NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (mean_confidence BETWEEN 0 AND 100),
  accepted_word_count INTEGER NOT NULL DEFAULT 0 CHECK (accepted_word_count >= 0),
  total_word_count INTEGER NOT NULL DEFAULT 0 CHECK (total_word_count >= 0),
  word_boxes JSONB NOT NULL DEFAULT '[]'::JSONB CHECK (jsonb_typeof(word_boxes) = 'array'),
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'accepted', 'needs_review', 'rejected')),
  pipeline_version INTEGER NOT NULL DEFAULT 1 CHECK (pipeline_version > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(metadata) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_sha256, page_number, pipeline_version)
);

CREATE INDEX IF NOT EXISTS vita_ocr_pages_source_idx
  ON public.vita_ocr_pages (source_sha256, page_number);

CREATE INDEX IF NOT EXISTS vita_ocr_pages_review_idx
  ON public.vita_ocr_pages (review_status, mean_confidence DESC);

ALTER TABLE public.vita_ocr_pages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.vita_ocr_pages FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vita_ocr_pages TO service_role;

COMMENT ON TABLE public.vita_ocr_pages IS
  'Estágio privado de OCR página a página, exclusivo da biblioteca dos tutores Aeternum Vita.';
COMMENT ON COLUMN public.vita_ocr_pages.word_boxes IS
  'Palavras OCR auditáveis com confiança e caixas de posição; nunca expostas ao cliente.';
COMMENT ON COLUMN public.vita_ocr_pages.review_status IS
  'Somente páginas aceitas após os gates de qualidade podem ser promovidas ao corpus textual da Vita.';
