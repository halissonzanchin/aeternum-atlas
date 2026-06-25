export const config = {
  runtime: 'edge', // Using Vercel Edge Runtime for faster cold boots if applicable
};

// Simple helper to truncate string to prevent prompt injection and excessive tokens
function truncateText(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Only POST allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // 1. Validate environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // If no API key, return a specific error that the frontend can catch to fallback
      return new Response(JSON.stringify({ 
        error: "NO_API_KEY", 
        message: "Chave do provedor de IA não configurada no backend seguro." 
      }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Parse payload
    const body = await req.json();
    const { question, viewerContext, history } = body;

    if (!question || typeof question !== 'string') {
      return new Response(JSON.stringify({ error: "Invalid question format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Security Limits
    const safeQuestion = truncateText(question, 500); // Max 500 chars for a question
    const modelTitle = truncateText(viewerContext?.modelTitle || "Modelo desconhecido", 100);
    const modelDescription = truncateText(viewerContext?.description || "Sem descrição", 500);
    
    // Safely format markers to inject as context (limit to names/titles to save tokens)
    const markersStr = Array.isArray(viewerContext?.markers) 
      ? viewerContext.markers.slice(0, 50).map(m => `- ${m.title}${m.latinName ? ` (${m.latinName})` : ''}`).join('\n')
      : "Nenhum marcador disponível.";

    // Format safe history (last 5 messages)
    const recentHistory = Array.isArray(history) ? history.slice(-5) : [];
    const formattedHistory = recentHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: truncateText(msg.text, 500)
    }));

    // 4. System Prompt Design
    const systemPrompt = `
Identidade:
Você é o Aeternum AI Tutor, assistente educacional da plataforma Aeternum Atlas/Biblioteca Cadavérica 3D.

Função:
Ajudar estudantes da saúde a estudar anatomia humana com base no modelo 3D atual aberto, marcadores oficiais, guia e conteúdos cadastrados.

Modelo Atual em Exibição:
- Título: ${modelTitle}
- Descrição: ${modelDescription}
- Marcadores Cadastrados:
${markersStr}

Regras Obrigatórias:
1. Responda em português claro, sendo didático.
2. Não invente estruturas ou detalhes se não fizerem sentido para a anatomia real ou se não estiverem no contexto.
3. Se a pergunta for totalmente fora do escopo médico/anatômico, diga que você foca no estudo de anatomia da Aeternum Atlas.
4. Se perguntarem sobre uma estrutura que não está nos marcadores, você pode explicar com base no seu conhecimento, mas sempre sugira que o aluno procure nos marcadores existentes para orientação espacial no modelo 3D.
5. Não dê diagnóstico médico individual ou prescrições.
6. Não substitua a figura do professor ou orientação médica.
7. Para navegar no viewer 3D, instrua o usuário a usar os ícones na tela (ex: botão de 'Marcadores' na barra inferior, 'Guia' na barra lateral).
8. Seja conciso e use formatação markdown básica para destaque de estruturas importantes.

Tom:
Profissional, acolhedor, institucional, objetivo e educacional.
`;

    // 5. Build OpenAI Payload
    const openAIPayload = {
      model: "gpt-4o-mini", // Cost-effective default for high speed
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedHistory,
        { role: "user", content: safeQuestion }
      ],
      temperature: 0.3,
      max_tokens: 500, // Limit response length
    };

    // 6. Call Provider (Secure Server-to-Server)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(openAIPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[AI Tutor] OpenAI API Error:", response.status, errText);
      throw new Error(`OpenAI responded with status ${response.status}`);
    }

    const data = await response.json();
    const aiText = data.choices[0].message.content;

    // 7. Return safe payload to frontend
    return new Response(JSON.stringify({
      source: "backend-ai",
      text: aiText
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[AI Tutor] Backend Error:", error);
    // Return generic error to prevent leakage
    return new Response(JSON.stringify({ 
      error: "INTERNAL_ERROR", 
      message: "Falha ao se comunicar com o provedor de IA via backend."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
