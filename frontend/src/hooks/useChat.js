import { useState, useEffect } from "react";
import { api } from "@/api/client";

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.get("/api/me/chat/history");
        if (res && res.ok) {
          const json = await res.json();
          if (json.history && json.history.length > 0) {
            setMessages(json.history);
          } else {
            setMessages([{ role: "assistant", content: "Olá! Sou seu assessor virtual. Como posso ajudar com seus investimentos na B3 hoje?" }]);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar histórico", e);
        setMessages([{ role: "assistant", content: "Olá! Tivemos um erro ao carregar seu histórico." }]);
      }
      setHistoryLoaded(true);
    }
    loadHistory();
  }, []);

  const sendMessage = async (inputMsg) => {
    const userMsg = { role: "user", content: inputMsg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      await api.post("/api/me/chat/history", { role: "user", content: inputMsg });

      const res = await api.post("/api/chat", { messages: newMessages });
      if (res && res.ok) {
        const data = await res.json();
        const aiMsg = { role: "assistant", content: data.reply || "Erro ao processar." };
        setMessages((prev) => [...prev, aiMsg]);
        await api.post("/api/me/chat/history", { role: "assistant", content: aiMsg.content });
      } else {
        let errorMsg = "Erro na comunicação com a API.";
        try {
          const errorData = await res.json();
          if (errorData.detail) {
            errorMsg = errorData.detail;
          }
        } catch (err) {}
        setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erro inesperado." }]);
    }
    setLoading(false);
  };

  const clearHistory = async () => {
    try {
      await api.delete("/api/me/chat/history");
      setMessages([{ role: "assistant", content: "Histórico limpo. Como posso te ajudar agora?" }]);
    } catch (e) {
      console.error("Erro ao limpar histórico", e);
    }
  };

  return { messages, loading, historyLoaded, sendMessage, clearHistory };
}
