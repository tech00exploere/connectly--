import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Send } from "lucide-react";

const Messages = () => {
  const { user, socket } = useAuth();
  const myId = user?._id;

  const [searchParams] = useSearchParams();
  const userId = searchParams.get("user");

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeUserId, setActiveUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const activeConversationRef = useRef(null);
  const bottomRef = useRef(null);

  // Deduplicate and sort conversations by latest message
  const normalizeConversations = useCallback(
    (list) => {
      const safe = Array.isArray(list) ? list : [];
      const byOtherUser = new Map();
      for (const c of safe) {
        const other = c?.participants?.find(
          (p) => String(p?._id) !== String(myId)
        );
        const key = other?._id || c?._id;
        if (!key) continue;

        const existing = byOtherUser.get(String(key));
        if (!existing) {
          byOtherUser.set(String(key), c);
          continue;
        }
        const existingTime = new Date(existing.lastMessageAt || 0).getTime();
        const currentTime = new Date(c.lastMessageAt || 0).getTime();
        if (currentTime > existingTime) {
          byOtherUser.set(String(key), c);
        }
      }
      return [...byOtherUser.values()].sort(
        (a, b) =>
          new Date(b.lastMessageAt || 0).getTime() -
          new Date(a.lastMessageAt || 0).getTime()
      );
    },
    [myId]
  );

  /* ——————————————— LOAD CONVERSATIONS ——————————————— */
  const loadConversations = useCallback(async () => {
    const res = await api.get("/messages");
    const normalized = normalizeConversations(res.data);
    setConversations(normalized);
    return normalized;
  }, [normalizeConversations]);

  useEffect(() => {
    loadConversations().catch(() => {});
  }, [loadConversations]);

  /* ——————————————— AUTO OPEN FROM URL ——————————————— */
  useEffect(() => {
    if (!userId) return;
    setActiveUserId(userId);

    const convo = conversations.find((c) =>
      c.participants?.some((p) => String(p._id) === String(userId))
    );

    if (convo) {
      openConversation(convo);
    } else {
      (async () => {
        try {
          const res = await api.get(`/messages/with/${userId}`);
          if (res.data?._id) {
            setConversations((prev) =>
              normalizeConversations([res.data, ...prev])
            );
            openConversation(res.data);
          } else {
            setActiveConversation(null);
            setMessages([]);
          }
        } catch {
          setActiveConversation(null);
          setMessages([]);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /* ——————————————— OPEN CONVERSATION ——————————————— */
  const openConversation = async (conversation) => {
    if (!conversation?._id) return;
    setActiveConversation(conversation);
    activeConversationRef.current = conversation;
    setMessages([]);
    setLoading(true);
    try {
      const res = await api.get(`/messages/${conversation._id}`);
      setMessages(res.data || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const getOtherUser = (conversation) =>
    conversation?.participants?.find(
      (p) => String(p._id) !== String(myId)
    ) || null;

  /* ——————————————— SEND MESSAGE ——————————————— */
  const sendMessage = async () => {
    if (!text.trim()) return;
    const receiverId = getOtherUser(activeConversation)?._id || activeUserId;
    if (!receiverId) return;

    const res = await api.post(`/messages/send/${receiverId}`, { text });
    const msg = res.data;
    setMessages((prev) => [...prev, msg]);
    setText("");

    const convoId = activeConversation?._id;
    if (convoId) {
      setConversations((prev) => [
        {
          ...prev.find((c) => c._id === convoId),
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt,
        },
        ...prev.filter((c) => c._id !== convoId),
      ].filter(Boolean));
    } else {
      const list = await loadConversations();
      const convo = list.find((c) =>
        c.participants?.some((p) => String(p._id) === String(receiverId))
      );
      if (convo) openConversation(convo);
    }
  };

  /* ——————————————— SCROLL TO BOTTOM ——————————————— */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ——————————————— SOCKET RECEIVE ——————————————— */
  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      const convo = activeConversationRef.current;
      if (msg.conversation === convo?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on("new-message", handler);
    return () => socket.off("new-message", handler);
  }, [socket]);

  /* ——————————————— UI ——————————————— */
  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[78vh] bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden text-gray-800 dark:text-gray-100">

      {/* Conversation list */}
      <aside className="w-1/3 min-w-[90px] max-w-[260px] border-r border-gray-100 dark:border-gray-700 overflow-y-auto flex flex-col">
        <div className="p-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
          Messages
        </div>
        {conversations.length === 0 && (
          <div className="p-4 text-sm text-gray-400 dark:text-gray-500 text-center mt-4">
            No conversations yet
          </div>
        )}
        {conversations.map((c) => {
          const other = getOtherUser(c);
          const isActive = activeConversation?._id === c._id;
          return (
            <div
              key={c._id}
              onClick={() => openConversation(c)}
              className={`p-3 cursor-pointer border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                isActive ? "bg-emerald-50 dark:bg-emerald-900/20" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
                  {(other?.username?.[0] || "?").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className={`font-semibold text-sm truncate ${isActive ? "text-emerald-700 dark:text-emerald-300" : ""}`}>
                    {other?.username || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {c.lastMessage || "Start a conversation"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </aside>

      {/* Chat panel */}
      <section className="flex-1 flex flex-col min-w-0">
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-2">
            <div className="text-4xl">💬</div>
            <p className="text-sm">Select a conversation to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
                {(getOtherUser(activeConversation)?.username?.[0] || "?").toUpperCase()}
              </div>
              <span className="font-semibold text-sm">
                {getOtherUser(activeConversation)?.username || "Unknown"}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Loading…
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No messages yet. Say hi! 👋
                </div>
              ) : (
                messages.map((m) => {
                  const senderId = m?.sender?._id || m?.sender;
                  const isMine = String(senderId) === String(myId);
                  return (
                    <div
                      key={m._id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm break-words ${
                          isMine
                            ? "bg-emerald-600 text-white rounded-br-sm"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex gap-2 items-center">
              <input
                id="message-text"
                name="messageText"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a message…"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl transition-colors flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Messages;
