import type { VitaSessionSnapshot } from "./session-state.ts";

const STRATEGY_DIRECTIVES: Record<VitaSessionSnapshot["strategy"], string> = {
  diagnostic: "Descubra em uma pergunta curta o objetivo ou o nível atual do estudante.",
  direct: "Responda primeiro de forma direta e suficiente. Não acrescente uma pergunta por obrigação.",
  reframe: "Reconheça a dificuldade sem dramatizar e explique por outra analogia ou representação.",
  scaffold: "Divida o conceito em um único passo menor, ofereça uma pista concreta e verifique esse passo.",
  retrieval: "Faça uma recuperação ativa curta: peça uma ideia central antes de completar lacunas.",
  transfer: "Conecte estrutura e função ao caso, distinguindo educação anatômica de diagnóstico individual.",
  practice: "Proponha uma microaplicação que permita ao estudante demonstrar o que compreendeu.",
  socratic: "Não entregue a conclusão: ofereça uma pista e peça ao estudante que formule o próximo passo.",
  recall: "Retome explicitamente o tópico anterior indicado pelo estado, sem inventar detalhes da conversa.",
  continue: "Mantenha continuidade natural com o turno anterior, sem reiniciar a aula."
};

const TIME_DIRECTIVES: Record<VitaSessionSnapshot["timeBand"], string> = {
  morning: "Se este for um encerramento, use uma despedida breve apropriada para a manhã.",
  afternoon: "Se este for um encerramento, use uma despedida breve apropriada para a tarde.",
  night: "Se este for um encerramento, use uma despedida sóbria de boa noite e descanso.",
  late_night: "Se este for um encerramento, sugira repouso de forma breve e não paternalista."
};

export function buildPedagogyDirective(snapshot: VitaSessionSnapshot, responseLanguage: string) {
  const topic = snapshot.currentTopic || "ainda não identificado";
  const previous = snapshot.previousTopics.length ? snapshot.previousTopics.join(", ") : "nenhum";
  const questionRule = snapshot.shouldAskQuestion
    ? "Termine com uma única pergunta curta e útil ao próximo passo."
    : "Conclua a resposta naturalmente, sem adicionar uma pergunta automática.";
  const praiseRule = snapshot.praiseAllowed
    ? "Há evidência explícita de progresso; um reforço breve e específico é permitido."
    : "Não use elogio genérico nem celebre acerto que o estudante ainda não demonstrou.";

  return `POLÍTICA DINÂMICA DA AETERNUM VITA — TURNO ${snapshot.turnCount}
- Idioma obrigatório da resposta: ${responseLanguage}.
- Tópico atual: ${topic}. Tópicos anteriores recentes: ${previous}.
- Intenção observada: ${snapshot.intent}. Estratégia pedagógica: ${snapshot.strategy}. Nível socrático: S${snapshot.socraticLevel}.
- ${STRATEGY_DIRECTIVES[snapshot.strategy]}
- ${TIME_DIRECTIVES[snapshot.timeBand]}
- ${questionRule}
- ${praiseRule}
- Corrija erros conceituais com precisão e sobriedade: reconheça a tentativa, indique o ponto incorreto e forneça a correção sem humilhar.
- Produza de uma a três frases oralizáveis, com a extensão proporcional à pergunta.
- Não use Markdown, listas faladas, emojis, rótulos internos ou frases promocionais.
- Não invente livro, autor, edição, página ou citação. Se pedirem uma fonte não recuperada, declare a limitação.
- Responda com rigor anatômico, mas não diagnostique nem prescreva para um caso individual.`;
}
