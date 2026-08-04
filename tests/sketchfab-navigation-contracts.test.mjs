import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SketchfabAnnotationBridge } from "../src/services/sketchfabAnnotationBridge.js";

const viewerSource = await readFile(
  new URL("../src/components/viewer/SketchfabApiViewer.jsx", import.meta.url),
  "utf8"
);
const annotationsHookSource = await readFile(
  new URL("../src/features/viewer/hooks/useViewerAnnotations.js", import.meta.url),
  "utf8"
);
const quizModalSource = await readFile(
  new URL("../src/components/AnatomicalQuiz/AnatomicalQuizModal.jsx", import.meta.url),
  "utf8"
);

test("a ponte do Sketchfab coalesce a mesma anotação e serializa destinos diferentes", () => {
  const callbacks = [];
  const calls = [];
  const bridge = new SketchfabAnnotationBridge();
  const api = {
    gotoAnnotation(index, options, callback) {
      calls.push({ index, options });
      callbacks.push(callback);
    }
  };

  bridge.registerSketchfabApi(api);

  assert.equal(bridge.goToSketchfabAnnotation(0, { requestId: "question-01" }), true);
  assert.equal(bridge.goToSketchfabAnnotation(0, { requestId: "question-01-repeat" }), false);
  assert.equal(bridge.goToSketchfabAnnotation(1, { requestId: "question-02" }), true);
  assert.deepEqual(calls.map(call => call.index), [0]);

  callbacks.shift()(null);
  assert.deepEqual(calls.map(call => call.index), [0, 1]);

  callbacks.shift()(null);
  bridge.unregisterSketchfabApi(api);
  assert.equal(bridge.isSketchfabReady(), false);
});

test("selecionar uma anotação emitida pelo Sketchfab atualiza estado sem reenviar gotoAnnotation", () => {
  const selectHandler = annotationsHookSource.match(
    /function handleSketchfabAnnotationSelect\(index\) \{([\s\S]*?)\n  \}/
  )?.[1] || "";

  assert.match(selectHandler, /setActiveAnnotationIndex\(index\)/);
  assert.doesNotMatch(selectHandler, /goToSketchfabAnnotation|gotoAnnotation/);
});

test("o Viewer usa a ponte serializada e remove a API global ao desmontar", () => {
  assert.match(viewerSource, /sketchfabBridge\.goToSketchfabAnnotation\(annotationIndex/);
  assert.match(viewerSource, /sketchfabBridge\.unregisterSketchfabApi\(apiRef\.current\)/);
  assert.doesNotMatch(viewerSource, /\bapi\.gotoAnnotation\(annotationIndex/);
});

test("o foco sincronizado do campo não dispara uma segunda navegação", () => {
  assert.match(quizModalSource, /suppressNextFocusNavigationRef/);
  assert.match(
    quizModalSource,
    /if \(suppressNextFocusNavigationRef\.current\) \{[\s\S]*?return;/
  );
});
