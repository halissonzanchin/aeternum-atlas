
import { describe, expect, it } from "vitest";
import { TUTOR_CONFIGS, getTutorConfig } from "./agent.ts";
import { loadVoiceRuntimeConfig } from "./runtime-config.ts";
import { formatKnowledgeContext, queryVitaKnowledge } from "./vita-rag.ts";

describe("MATRIZ EXAUSTIVA DE TESTES ANATÔMICOS — 4 TUTORES & 4 IDIOMAS", () => {
  const runtime = loadVoiceRuntimeConfig({});

  // ==========================================
  // 1. EDUARDO (PORTUGUÊS 🇧🇷) - 6 TESTES
  // ==========================================
  describe("🇧🇷 Tutor Eduardo (Português)", () => {
    it("PT-01: Membro Superior — Clavícula e Manguito Rotador", async () => {
      const res = await queryVitaKnowledge("Eduardo, explique a clavícula", "eduardo", "pt", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("clavícula");
      expect(formatKnowledgeContext(res!)).toContain("Moore");
    });

    it("PT-02: Membro Superior — Plexo Braquial", async () => {
      const res = await queryVitaKnowledge("Fale sobre as raízes do plexo braquial", "eduardo", "pt", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("plexo braquial");
    });

    it("PT-03: Membro Inferior — Fêmur e Articulação Coxofemoral", async () => {
      const res = await queryVitaKnowledge("Quais os acidentes ósseos do fêmur e risco de necrose avascular?", "eduardo", "pt", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("cabeça femoral");
    });

    it("PT-04: Membro Inferior — Joelho, LCA, LCP e Meniscos", async () => {
      const res = await queryVitaKnowledge("Como funciona a estabilidade do joelho e os ligamentos cruzados?", "eduardo", "pt", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("Ligamento Cruzado");
    });

    it("PT-05: Tórax & Circulação — Coração e Pulmões", async () => {
      const res = await queryVitaKnowledge("Explique as câmaras do coração e vascularização", "eduardo", "pt", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("coração");
    });

    it("PT-06: Neuroanatomia — 12 Pares Cranianos", async () => {
      const res = await queryVitaKnowledge("Quais são os 12 pares de nervos cranianos?", "eduardo", "pt", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("pares de nervos cranianos");
    });
  });

  // ==========================================
  // 2. ANTONIA (ESPANHOL 🇪🇸) - 4 TESTES
  // ==========================================
  describe("🇪🇸 Tutora Antonia (Español)", () => {
    it("ES-01: Miembro Superior — Escápula y Manguito Rotador", async () => {
      const res = await queryVitaKnowledge("Antonia, explícame la escápula", "antonia", "es", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("escápula");
    });

    it("ES-02: Miembro Inferior — Fémur y Rodilla (LCA)", async () => {
      const res = await queryVitaKnowledge("¿Cuáles son las características del fémur?", "antonia", "es", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("fémur");
    });

    it("ES-03: Tórax y Abdomen — Corazón e Hígado (Couinaud)", async () => {
      const res = await queryVitaKnowledge("Explica las cavidades del corazón", "antonia", "es", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("corazón");
    });

    it("ES-04: Neuroanatomía — Pares Craneales y Base del Cráneo", async () => {
      const res = await queryVitaKnowledge("Dime los 12 pares craneales", "antonia", "es", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("pares craneales");
    });
  });

  // ==========================================
  // 3. ARIANA (INGLÊS 🇺🇸) - 4 TESTES
  // ==========================================
  describe("🇺🇸 Tutor Ariana (English)", () => {
    it("EN-01: Upper Limb — Brachial Plexus and Carpal Tunnel", async () => {
      const res = await queryVitaKnowledge("Ariana, explain the brachial plexus roots", "ariana", "en", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("brachial plexus");
    });

    it("EN-02: Lower Limb — Femur and Knee Biomechanics (ACL/PCL)", async () => {
      const res = await queryVitaKnowledge("Describe the femur landmarks and hip joint", "ariana", "en", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("femur");
    });

    it("EN-03: Thorax — Heart chambers and Lungs", async () => {
      const res = await queryVitaKnowledge("Explain the heart chambers and circulation", "ariana", "en", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("heart");
    });

    it("EN-04: Neuroanatomy — Circle of Willis", async () => {
      const res = await queryVitaKnowledge("Detail the Circle of Willis arteries", "ariana", "en", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("Circle of Willis");
    });
  });

  // ==========================================
  // 4. FABIAN (ALEMÃO 🇩🇪) - 4 TESTES
  // ==========================================
  describe("🇩🇪 Tutor Fabian (Deutsch)", () => {
    it("DE-01: Obere Extremität — Humerus und Rotatorenmanschette", async () => {
      const res = await queryVitaKnowledge("Fabian, erkläre den Humerus", "fabian", "de", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("Humerus");
    });

    it("DE-02: Untere Extremität — Femur und Kniegelenk", async () => {
      const res = await queryVitaKnowledge("Beschreibe das Femur", "fabian", "de", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("Femur");
    });

    it("DE-03: Thorax und Abdomen — Herz und Nieren", async () => {
      const res = await queryVitaKnowledge("Erkläre das Herz und die Koronargefäße", "fabian", "de", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("Herz");
    });

    it("DE-04: Neuroanatomie — 12 Hirnnerven", async () => {
      const res = await queryVitaKnowledge("Nenne die 12 Hirnnerven", "fabian", "de", runtime);
      expect(res).not.toBeNull();
      expect(res?.context).toContain("Hirnnerven");
    });
  });
});
