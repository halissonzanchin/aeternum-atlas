import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  atlasAITutorService,
  sanitizeTutorDisplayText
} from "../features/atlas-viewer/ai/atlasAITutorService";
import { getSupabaseClient, isSupabaseConfigured } from "../services/supabase/supabaseClient";

const STORAGE_VERSION = 2;
const MAX_MESSAGES = 160;
const DEFAULT_WELCOME_MESSAGE = {
  id: "atlas-ai-welcome",
  sender: "ai",
  text: "Olá, sou o Aeternum AI Tutor. Esta conversa acompanha você por toda a plataforma. Posso explicar estruturas, relacionar conteúdos e manter a continuidade do seu estudo entre o Atlas, a biblioteca e os modelos 3D."
};

const AtlasAITutorSessionContext = createContext(null);

function createMessageId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeStoredMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [DEFAULT_WELCOME_MESSAGE];
  }

  const normalized = messages
    .filter((message) => message && typeof message.text === "string" && message.text.trim())
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      id: message.id || createMessageId(message.sender || "message"),
      sender: message.sender === "user" ? "user" : "ai",
      text: message.sender === "user"
        ? message.text
        : sanitizeTutorDisplayText(message.text),
      action: message.action || null,
      payload: message.payload ?? null,
      contextLabel: message.contextLabel || null,
      createdAt: message.createdAt || null
    }));

  return normalized.length ? normalized : [DEFAULT_WELCOME_MESSAGE];
}

function readStoredSession(storageKey) {
  if (typeof window === "undefined") {
    return {
      messages: [DEFAULT_WELCOME_MESSAGE],
      draft: "",
      connectionMode: "idle",
      conversationId: null
    };
  }

  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) || "null");
    if (stored?.version >= 1 && stored?.version <= STORAGE_VERSION) {
      return {
        messages: normalizeStoredMessages(stored.messages),
        draft: typeof stored.draft === "string" ? stored.draft : "",
        connectionMode: stored.connectionMode || "idle",
        conversationId: typeof stored.conversationId === "string" ? stored.conversationId : null
      };
    }
  } catch {
    // Uma sessão corrompida é descartada sem impedir o uso do Tutor IA.
  }

  return {
    messages: [DEFAULT_WELCOME_MESSAGE],
    draft: "",
    connectionMode: "idle",
    conversationId: null
  };
}

export function AtlasAITutorSessionProvider({ children, user }) {
  const identity = user?.id || user?.email || "anonymous";
  const storageKey = `aeternum_atlas_ai_session:${identity}`;
  const initialSession = useMemo(() => readStoredSession(storageKey), [storageKey]);
  const [messages, setMessages] = useState(initialSession.messages);
  const [draft, setDraftState] = useState(initialSession.draft);
  const [isThinking, setIsThinking] = useState(false);
  const [connectionMode, setConnectionMode] = useState(initialSession.connectionMode);
  const [conversationId, setConversationId] = useState(initialSession.conversationId);
  const [tutorRequest, setTutorRequest] = useState(null);
  const draftRef = useRef(initialSession.draft);
  const thinkingRef = useRef(false);

  const commitMessages = useCallback((updater) => {
    setMessages((currentMessages) => {
      const nextMessages = typeof updater === "function"
        ? updater(currentMessages)
        : updater;
      const limitedMessages = nextMessages.slice(-MAX_MESSAGES);
      return limitedMessages;
    });
  }, []);

  const setDraft = useCallback((value) => {
    const nextDraft = typeof value === "function" ? value(draftRef.current) : value;
    draftRef.current = nextDraft;
    setDraftState(nextDraft);
  }, []);

  const appendMessage = useCallback((message) => {
    const normalizedMessage = {
      id: message.id || createMessageId(message.sender || "message"),
      sender: message.sender === "user" ? "user" : "ai",
      text: message.sender === "user"
        ? message.text || ""
        : sanitizeTutorDisplayText(message.text),
      action: message.action || null,
      payload: message.payload ?? null,
      contextLabel: message.contextLabel || null,
      createdAt: message.createdAt || new Date().toISOString()
    };
    commitMessages((currentMessages) => [...currentMessages, normalizedMessage]);
    return normalizedMessage;
  }, [commitMessages]);

  const openTutor = useCallback((request = {}) => {
    setTutorRequest({
      id: createMessageId("tutor-request"),
      prompt: String(request.prompt || "").trim(),
      context: request.context || {},
      contextLabel: request.contextLabel || "Plataforma Aeternum Atlas"
    });
  }, []);

  const consumeTutorRequest = useCallback((requestId) => {
    setTutorRequest((currentRequest) => (
      currentRequest?.id === requestId ? null : currentRequest
    ));
  }, []);

  const updateMessage = useCallback((messageId, patch) => {
    commitMessages((currentMessages) => currentMessages.map((message) => (
      message.id === messageId ? { ...message, ...patch } : message
    )));
  }, [commitMessages]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured()) return undefined;
    let cancelled = false;

    async function restoreRemoteConversation() {
      const client = getSupabaseClient();
      let remoteConversationId = conversationId;

      if (!remoteConversationId) {
        const { data: conversations, error: conversationError } = await client
          .from("ai_conversations")
          .select("id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1);
        if (conversationError || !conversations?.[0]?.id || cancelled) return;
        remoteConversationId = conversations[0].id;
      }

      const { data: remoteMessages, error: messagesError } = await client
        .from("ai_messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", remoteConversationId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(MAX_MESSAGES - 1);

      if (messagesError || cancelled) return;
      setConversationId(remoteConversationId);
      if (remoteMessages?.length) {
        commitMessages([
          DEFAULT_WELCOME_MESSAGE,
          ...remoteMessages.slice().reverse().map((message) => ({
            id: message.id,
            sender: message.role === "user" ? "user" : "ai",
            text: message.role === "user"
              ? message.content
              : sanitizeTutorDisplayText(message.content),
            createdAt: message.created_at,
            contextLabel: "Histórico sincronizado"
          }))
        ]);
        setConnectionMode("online");
      }
    }

    void restoreRemoteConversation();
    return () => {
      cancelled = true;
    };
  }, [commitMessages, conversationId, user?.id]);

  const sendMessage = useCallback(async ({
    text,
    context = {},
    contextLabel = "Plataforma Aeternum Atlas"
  } = {}) => {
    const normalizedText = String(text ?? draftRef.current).trim();
    if (!normalizedText || thinkingRef.current) return null;

    const createdAt = new Date().toISOString();
    const userMessage = {
      id: createMessageId("user"),
      sender: "user",
      text: normalizedText,
      contextLabel,
      createdAt
    };
    const aiMessageId = createMessageId("ai");
    const aiPlaceholder = {
      id: aiMessageId,
      sender: "ai",
      text: "",
      contextLabel,
      createdAt,
      isStreaming: true
    };

    commitMessages((currentMessages) => [...currentMessages, userMessage, aiPlaceholder]);
    setDraft("");
    thinkingRef.current = true;
    setIsThinking(true);

    try {
      // Grafo de Conhecimento Anatômico - Injeção Dinâmica de Contexto Relacional Latarjet
      let graphContextPrompt = "";
      try {
        const { buildGraphContextPrompt } = await import("../services/ai/anatomicalKnowledgeGraphService");
        graphContextPrompt = buildGraphContextPrompt(normalizedText);
      } catch (e) {
        console.warn("[KnowledgeGraph] Grafo indisponível nesta requisição", e);
      }

      const enrichedContext = {
        ...context,
        knowledgeGraphPrompt: graphContextPrompt || null
      };

      const response = await atlasAITutorService.processMessageStream(
        normalizedText,
        enrichedContext,
        (chunkText) => updateMessage(aiMessageId, {
          text: sanitizeTutorDisplayText(chunkText),
          isStreaming: true
        }),
        conversationId
      );

      updateMessage(aiMessageId, {
        text: sanitizeTutorDisplayText(response.text),
        action: response.action || null,
        payload: response.payload ?? null,
        isStreaming: false
      });
      setConnectionMode(response.mode || "online");
      if (response.conversationId) setConversationId(response.conversationId);
      return response;
    } catch (error) {
      console.error("[Atlas AI Session] Falha inesperada:", error);
      const fallbackResponse = {
        text: "Não consegui concluir esta resposta agora. Sua pergunta e o histórico foram preservados para você continuar quando a conexão estiver disponível.",
        mode: "offline"
      };
      updateMessage(aiMessageId, {
        text: fallbackResponse.text,
        isStreaming: false
      });
      setConnectionMode("offline");
      return fallbackResponse;
    } finally {
      thinkingRef.current = false;
      setIsThinking(false);
    }
  }, [commitMessages, conversationId, setDraft, updateMessage]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const persistentMessages = messages
      .filter((message) => !message.isStreaming && message.text?.trim())
      .slice(-MAX_MESSAGES);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({
        version: STORAGE_VERSION,
        messages: persistentMessages,
        draft,
        connectionMode,
        conversationId
      }));
    } catch {
      // O histórico permanece em memória quando o storage do navegador está indisponível.
    }
  }, [connectionMode, conversationId, draft, messages, storageKey]);

  const value = useMemo(() => ({
    user,
    messages,
    draft,
    setDraft,
    isThinking,
    connectionMode,
    conversationId,
    sendMessage,
    appendMessage,
    tutorRequest,
    openTutor,
    consumeTutorRequest
  }), [
    appendMessage,
    consumeTutorRequest,
    connectionMode,
    conversationId,
    draft,
    isThinking,
    messages,
    openTutor,
    sendMessage,
    setDraft,
    tutorRequest,
    user
  ]);

  return (
    <AtlasAITutorSessionContext.Provider value={value}>
      {children}
    </AtlasAITutorSessionContext.Provider>
  );
}

export function useAtlasAITutorSession() {
  const context = useContext(AtlasAITutorSessionContext);
  if (!context) {
    throw new Error("useAtlasAITutorSession precisa estar dentro de AtlasAITutorSessionProvider.");
  }
  return context;
}
