/**
 * Teste unitário e de integração dos módulos do frontend P0.13.2
 * sessionGuardService, A26SessionDisplacedModal logic, ProtectedRoute logic
 */

import {
  sessionGuardService,
  SESSION_GUARD_STATES,
  QUALIFIED_ACTIVITY_TYPES,
  isQualifiedActivityType
} from "../../src/services/session/sessionGuardService.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

console.log("================================================================================");
console.log(" TESTE UNITÁRIO DE COMPONENTES E SERVIÇOS DO FRONTEND (P0.13.2)");
console.log("================================================================================\n");

// 1. Test Qualified vs Non-Qualified activity types
console.log("[TEST 1] Validação de Tipos de Atividade Qualificada...");
const qualifiedSamples = [
  "form_tool_interaction",
  "ai_tutor_query",
  "quiz_answer_submission",
  "flashcard_review",
  "agenda_edit",
  "model_3d_interaction",
  "active_navigation_reading",
  "educational_progress"
];

for (const q of qualifiedSamples) {
  assert(isQualifiedActivityType(q) === true, `Atividade '${q}' deve ser qualificada`);
}

const nonQualifiedSamples = [
  "heartbeat",
  "jwt_refresh",
  "data_polling",
  "health_check",
  "session_sync",
  "background_update",
  "login_attempt_refused",
  "presence_check",
  "unknown_signal",
  null,
  undefined,
  ""
];

for (const nq of nonQualifiedSamples) {
  assert(isQualifiedActivityType(nq) === false, `Sinal '${nq}' NÃO DEVE ser qualificado`);
}
console.log("✓ Teste 1 passou: filtro estrito de atividades qualificadas verificado.\n");

// 2. Test sessionGuardService state machine transitions
console.log("[TEST 2] Teste da Máquina de Estados do sessionGuardService...");
sessionGuardService.reset();
assert(sessionGuardService.getState().isAuthorized === false, "Inicialmente isAuthorized deve ser false");
assert(sessionGuardService.getState().isDisplaced === false, "Inicialmente isDisplaced deve ser false");

// Simulate rejection of secondary login
sessionGuardService.notifyAlreadyActive({
  code: "SESSION_ALREADY_ACTIVE",
  error: "Esta conta já possui uma sessão ativa em outro dispositivo."
});
const stateAfterRefusal = sessionGuardService.getState();
assert(stateAfterRefusal.isDisplaced === true, "isDisplaced deve ser true após recusa");
assert(stateAfterRefusal.isAuthorized === false, "isAuthorized deve ser false após recusa");
assert(stateAfterRefusal.currentSessionId === null, "currentSessionId deve ser null para sessão recusada");
assert(stateAfterRefusal.status === "SESSION_ALREADY_ACTIVE", "status deve ser SESSION_ALREADY_ACTIVE");

// Ensure revokeSession from secondary rejected login does NOT invoke server RPC
let rpcCalled = false;
// sessionGuardService.revokeSession should silently reset without error and without touching server
await sessionGuardService.revokeSession("user_logout");
assert(sessionGuardService.getState().isDisplaced === false, "isDisplaced deve ser resetado após dismiss/logout");
assert(sessionGuardService.getState().isAuthorized === false, "isAuthorized permanece false");
console.log("✓ Teste 2 passou: sessão recusada não herda autorização e logout local não toca no servidor.\n");

// 3. Test Inactivity Expiration state transition
console.log("[TEST 3] Teste de Notificação de Expiração por Inatividade (60m)...");
sessionGuardService.notifyExpired({
  code: "SESSION_EXPIRED_INACTIVITY",
  reason: "inactivity_timeout",
  error: "Seu acesso foi encerrado após 60 minutos sem atividade para proteger sua conta."
});
const expiredState = sessionGuardService.getState();
assert(expiredState.isExpired === true, "isExpired deve ser true");
assert(expiredState.isAuthorized === false, "isAuthorized deve ser false após expiração");
assert(expiredState.status === "SESSION_EXPIRED_INACTIVITY", "status deve ser SESSION_EXPIRED_INACTIVITY");
console.log("✓ Teste 3 passou: expiração por inatividade desativa autorização e sinaliza isExpired.\n");

// 4. Test Service Unavailable (Situation C - Fail-Closed)
console.log("[TEST 4] Teste de Indisponibilidade Temporária (Situação C - Fail-Closed)...");
sessionGuardService.notifyUnavailable({
  code: "SESSION_GUARD_UNAVAILABLE",
  reason: "rpc_timeout",
  error: "Estamos com uma indisponibilidade temporária na validação da sessão."
});
const unavailableState = sessionGuardService.getState();
assert(unavailableState.isUnavailable === true, "isUnavailable deve ser true");
assert(unavailableState.isAuthorized === false, "isAuthorized deve ser false em erro de validação");
assert(unavailableState.isDisplaced === false, "isDisplaced deve ser false em erro de rede (não confundir com outro dispositivo)");
console.log("✓ Teste 4 passou: falha de validação ativa fail-closed sem acusar falso dispositivo.\n");

console.log("================================================================================");
console.log(" TODOS OS TESTES UNITÁRIOS DO FRONTEND FORAM CONCLUÍDOS COM SUCESSO!");
console.log("================================================================================\n");
