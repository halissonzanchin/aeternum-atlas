import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { atlasAITutorService } from "../features/atlas-viewer/ai/atlasAITutorService";

const STORAGE_VERSION = 1;
const MAX_MESSAGES = 80;
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
      text: message.text,
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
      connectionMode: "idle"
    };
  }

  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) || "null");
    if (stored?.version === STORAGE_VERSION) {
      return {
        messages: normalizeStoredMessages(stored.messages),
        draft: typeof stored.draft === "string" ? stored.draft : "",
        connectionMode: stored.connectionMode || "idle"
      };
    }
  } catch {
    // Uma sessão corrompida é descartada sem impedir o uso do Tutor IA.
  }

  return {
    messages: [DEFAULT_WELCOME_MESSAGE],
    draft: "",
    connectionMode: "idle"
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
  const messagesRef = useRef(initialSession.messages);
  const draftRef = useRef(initialSession.draft);
  const thinkingRef = useRef(false);

  const commitMessages = useCallback((updater) => {
    setMessages((currentMessages) => {
      const nextMessages = typeof updater === "function"
        ? updater(currentMessages)
        : updater;
      const limitedMessages = nextMessages.slice(-MAX_MESSAGES);
      messagesRef.current = limitedMessages;
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
      text: message.text || "",
      action: message.action || null,
      payload: message.payload ?? null,
      contextLabel: message.contextLabel || null,
      createdAt: message.createdAt || new Date().toISOString()
    };
    commitMessages((currentMessages) => [...currentMessages, normalizedMessage]);
    return normalizedMessage;
  }, [commitMessages]);

  const updateMessage = useCallback((messageId, patch) => {
    commitMessages((currentMessages) => currentMessages.map((message) => (
      message.id === messageId ? { ...message, ...patch } : message
    )));
  }, [commitMessages]);

  const sendMessage = useCallback(async ({
    text,
    context = {},
    contextLabel = "Plataforma Aeternum Atlas",
    role
  } = {}) => {
    const normalizedText = String(text ?? draftRef.current).trim();
    if (!normalizedText || thinkingRef.current) return null;

    const conversationHistory = messagesRef.current
      .filter((message) => message.text?.trim() && !message.isStreaming)
      .map(({ sender, text: historyText }) => ({ sender, text: historyText }));
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
      const response = await atlasAITutorService.processMessageStream(
        normalizedText,
        context,
        conversationHistory,
        role || user?.role || "student",
        (chunkText) => updateMessage(aiMessageId, {
          text: chunkText,
          isStreaming: true
        })
      );

      updateMessage(aiMessageId, {
        text: response.text,
        action: response.action || null,
        payload: response.payload ?? null,
        isStreaming: false
      });
      setConnectionMode(response.mode || "online");
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
  }, [commitMessages, setDraft, updateMessage, user?.role]);

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
        connectionMode
      }));
    } catch {
      // O histórico permanece em memória quando o storage do navegador está indisponível.
    }
  }, [connectionMode, draft, messages, storageKey]);

  const value = useMemo(() => ({
    user,
    messages,
    draft,
    setDraft,
    isThinking,
    connectionMode,
    sendMessage,
    appendMessage
  }), [
    appendMessage,
    connectionMode,
    draft,
    isThinking,
    messages,
    sendMessage,
    setDraft,
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
