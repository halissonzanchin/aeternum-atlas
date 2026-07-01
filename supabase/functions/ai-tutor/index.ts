import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não está configurada nas variáveis de ambiente da Edge Function.");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using gemini-1.5-flash for speed/cost

    const { messages, context, role } = await req.json();

    // Determine Role Instructions
    let roleInstructions = "";
    if (role === "teacher" || role === "admin" || role === "institution_admin") {
      roleInstructions = `
Você está falando com um PROFESSOR ou ADMINISTRADOR. 
Você pode dar respostas diretas, listar gabaritos e ajudar a configurar aulas ou trilhas de estudos.
Sempre seja direto e profissional. Ajude o professor a usar a plataforma e forneça dados detalhados.
`;
    } else {
      roleInstructions = `
Você está falando com um ESTUDANTE.
Sua principal função é atuar como Tutor Socrático. NUNCA dê respostas diretas para quizzes ou avaliações.
Guie o estudante com dicas, perguntas instigantes e ajude-o a encontrar a resposta anatômica por si mesmo.
Incentive o uso do guia de estudo e dos simulados práticos e teóricos.
`;
    }

    const systemInstruction = `
Você é o Aeternum AI Tutor, um assistente avançado de anatomia 3D integrado à plataforma Aeternum Atlas.
Contexto atual da visualização do usuário:
Modelo atual: ${context?.modelTitle || 'Nenhum modelo específico'}
Painel aberto: ${context?.activePanel || 'Nenhum'}
Marcadores disponíveis na cena: ${context?.markers ? context.markers.map((m: any) => m.title).join(', ') : 'Nenhum'}

Instruções baseadas no perfil do usuário:
${roleInstructions}

Você pode executar Ações Especiais no frontend do usuário enviando as respostas em formato JSON se quiser disparar comandos.
No entanto, nesta versão, apenas responda em texto normal, guiando o usuário sobre o conteúdo anatômico ou sugerindo ações.
Use formatação Markdown. Seja amigável, claro e conciso.
`;

    // Format history for Gemini
    // Gemini expects format: { role: 'user' | 'model', parts: [{text: '...'}] }
    // We will inject the system prompt in the very first user message if history is short, or use systemInstruction feature of gemini API.
    // GoogleGenerativeAI supports systemInstruction directly.
    const generativeModel = genAI.getGenerativeModel({ 
        model: "gemini-flash-latest",
        systemInstruction: systemInstruction 
    });

    let formattedHistory = messages.slice(0, -1).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Gemini API requires history to start with 'user' and alternate
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }
    
    const sanitizedHistory = [];
    for (const msg of formattedHistory) {
      if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === msg.role) {
        sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += '\n' + msg.parts[0].text;
      } else {
        sanitizedHistory.push(msg);
      }
    }

    const chat = generativeModel.startChat({
      history: sanitizedHistory,
    });

    const lastMessage = messages[messages.length - 1];
    
    // Generate streaming response
    const result = await chat.sendMessageStream(lastMessage.text);

    // Create a stream that parses Gemini's chunk format and sends standard SSE
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
             const data = JSON.stringify({ text: chunkText });
             controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
          }
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error("Erro na Edge Function ai-tutor:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
