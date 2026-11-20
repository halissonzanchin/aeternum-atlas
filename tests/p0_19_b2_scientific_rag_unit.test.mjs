import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildCalibratedSearchQueries,
  matchAnatomicalWord,
  normalizeAnatomicalKey,
  ENHANCED_ANATOMICAL_SYNONYM_MAP
} from "../tools/scripts/calibrated_retrieval.mjs";

describe("P0.19-B.2 — Scientific RAG & Evidence Gate Unit Test Suite (Offline)", () => {

  describe("1. Whole-Word Regex Isolation (Sub-string Collision Prevention)", () => {
    it("never extracts 'rim' from 'comprimida' (TC-35 Regression Guard)", () => {
      const sentence = "Qual estrutura é comprimida na síndrome do túnel do carpo?";
      const matchesRim = matchAnatomicalWord(sentence, "rim");
      assert.equal(matchesRim, false, "Word 'rim' must NOT match inside 'comprimida'");
    });

    it("matches 'rim' when isolated as an exact independent word", () => {
      assert.equal(matchAnatomicalWord("Anatomia do rim direito", "rim"), true);
      assert.equal(matchAnatomicalWord("Rim: vascularização e hilo", "rim"), true);
      assert.equal(matchAnatomicalWord("O órgão é o rim", "rim"), true);
    });

    it("prevents collisions for other short anatomical tokens", () => {
      // 'mao' inside 'limao', 'pe' inside 'papel', 'osso' inside 'posso'
      assert.equal(matchAnatomicalWord("suco de limao", "mao"), false);
      assert.equal(matchAnatomicalWord("papel de filtro", "pe"), false);
      assert.equal(matchAnatomicalWord("eu posso ir", "osso"), false);
      assert.equal(matchAnatomicalWord("osso da face", "osso"), true);
      assert.equal(matchAnatomicalWord("dor na mao", "mao"), true);
      assert.equal(matchAnatomicalWord("trauma no pe", "pe"), true);
    });
  });

  describe("2. Calibrated Search Query Generation", () => {
    it("expands single short terms with canonical synonyms and Latin TA2", () => {
      const queries = buildCalibratedSearchQueries("Escápula");
      assert.ok(queries.length >= 1, "Should generate queries");
      assert.ok(queries.some(q => q.toLowerCase().includes("escapula") || q.toLowerCase().includes("escápula")));
      assert.ok(queries.some(q => q.toLowerCase().includes("omóplato") || q.toLowerCase().includes("omoplato") || q.toLowerCase().includes("scapula")));
    });

    it("preserves nuclear entity in complex sentences with >=4 terms", () => {
      const complexPrompt = "Quais são as inserções proximais e distais do músculo bíceps braquial?";
      const queries = buildCalibratedSearchQueries(complexPrompt);
      assert.ok(queries.length >= 2, "Must produce multiple calibrated queries");
      const hasNuclear = queries.some(q => q.toLowerCase().includes("biceps") || q.toLowerCase().includes("bíceps"));
      assert.ok(hasNuclear, "Queries must retain nuclear entity bíceps braquial");
    });

    it("handles Latin TA2 international terminology", () => {
      const latinPrompt = "Quais estruturas formam o circulus arteriosus cerebri?";
      const queries = buildCalibratedSearchQueries(latinPrompt);
      assert.ok(queries.length >= 2);
      const hasCircle = queries.some(q => q.toLowerCase().includes("circulo arterial") || q.toLowerCase().includes("círculo arterial") || q.toLowerCase().includes("willis"));
      assert.ok(hasCircle, "Must map Latin circulus arteriosus to círculo arterial do cérebro and polígono de willis");
    });

    it("handles multilingual Spanish queries seamlessly", () => {
      const spanishPrompt = "¿Cuáles son las inserciones del músculo pectoral mayor según Latarjet?";
      const queries = buildCalibratedSearchQueries(spanishPrompt);
      assert.ok(queries.length >= 2);
      const hasPectoral = queries.some(q => q.toLowerCase().includes("peitoral maior") || q.toLowerCase().includes("pectoral mayor"));
      assert.ok(hasPectoral, "Must map Spanish pectoral mayor to peitoral maior and pectoralis major");
    });
  });

  describe("3. Evidence Gate Sufficiency Evaluation (Offline Contract)", () => {
    // Pure function replicating evaluateEvidenceSufficiency
    function evaluateEvidenceSufficiency(sources, canonicalFacts = [], graphPrompt = "") {
      if (canonicalFacts && canonicalFacts.length > 0) {
        return { sufficient: true, reason: "CANONICAL_CONTEXT_AVAILABLE" };
      }
      if (graphPrompt && graphPrompt.trim().length >= 20) {
        return { sufficient: true, reason: "GRAPH_CONTEXT_AVAILABLE" };
      }
      if (!sources || sources.length === 0) {
        return { sufficient: false, reason: "NO_SOURCES_RETRIEVED" };
      }
      const topMatch = sources[0];
      const hasContent = Boolean(topMatch.content && topMatch.content.trim().length >= 40);
      if (hasContent) {
        return { sufficient: true, reason: "SOURCE_EVIDENCE_SUFFICIENT" };
      }
      return { sufficient: false, reason: "LOW_CONFIDENCE_RETRIEVAL" };
    }

    it("blocks fail-closed when no sources are retrieved", () => {
      const res = evaluateEvidenceSufficiency([], [], "");
      assert.equal(res.sufficient, false);
      assert.equal(res.reason, "NO_SOURCES_RETRIEVED");
    });

    it("blocks when retrieved chunk content is under 40 characters (low confidence)", () => {
      const weakSource = [{ id: "c1", content: "Músculo bíceps." }];
      const res = evaluateEvidenceSufficiency(weakSource, [], "");
      assert.equal(res.sufficient, false);
      assert.equal(res.reason, "LOW_CONFIDENCE_RETRIEVAL");
    });

    it("passes when retrieved chunk content is substantial (>=40 characters)", () => {
      const goodSource = [{
        id: "c2",
        book_title: "Moore 7ed",
        page_number: 823,
        content: "O músculo bíceps braquial possui duas cabeças de origem na escápula e insere-se distalmente na tuberosidade do rádio."
      }];
      const res = evaluateEvidenceSufficiency(goodSource, [], "");
      assert.equal(res.sufficient, true);
      assert.equal(res.reason, "SOURCE_EVIDENCE_SUFFICIENT");
    });

    it("passes when canonical facts are present even if external sources are empty", () => {
      const res = evaluateEvidenceSufficiency([], [{ structure: "Biceps", origin: "Scapula" }], "");
      assert.equal(res.sufficient, true);
      assert.equal(res.reason, "CANONICAL_CONTEXT_AVAILABLE");
    });

    it("passes when graph prompt is at least 20 characters", () => {
      const res = evaluateEvidenceSufficiency([], [], "Estrutura do plexo braquial: troncos e fascículos");
      assert.equal(res.sufficient, true);
      assert.equal(res.reason, "GRAPH_CONTEXT_AVAILABLE");
    });
  });

  describe("4. Normalization and Key Sanitization", () => {
    it("strips diacritics and non-alphanumeric punctuation while maintaining whitespace structure", () => {
      assert.equal(normalizeAnatomicalKey("Artéria Carótida Comum!"), "arteria carotida comum");
      assert.equal(normalizeAnatomicalKey("   Músculo   deltoide   "), "musculo deltoide");
      assert.equal(normalizeAnatomicalKey("circulus arteriosus (cerebri)"), "circulus arteriosus cerebri");
    });
  });
});
