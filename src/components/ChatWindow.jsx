import React, { useEffect, useMemo, useState } from "react";
import MessageBubble from "./MessageBubble";
import "./chatWindow.css";
import useWs from "../context/useWs";

export default function ChatWindow({ title = "Chat", initialMessages }) {
  const { client, connected } = useWs();
  const [text, setText] = useState("");

  const [messages, setMessages] = useState(
    () =>
      initialMessages ?? [
        {
          id: "m1",
          side: "left",
          author: "Huy lò",
          content: "hello world",
          time: "20:28",
        },
        { id: "m2", side: "right", content: "alo", time: "20:28" },
        { id: "m3", side: "right", content: "mai làm", time: "20:28" },
      ]
  );

  useEffect(() => {
    // Listen for server messages (JSON)
    const off = client.on("json", (data) => {
      // This part depends on your server protocol.
      // For now, render anything that looks like a chat message.
      const maybeText = data?.mes ?? data?.message ?? data?.data?.message;
      if (!maybeText) return;

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          side: "left",
          author: data?.user || data?.from || "Server",
          content: String(maybeText),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    });

    return () => off();
  }, [client]);

  const canSend = useMemo(() => text.trim().length > 0, [text]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSend) return;

    const content = text.trim();

    // Optimistic UI (show immediately on the right)
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        side: "right",
        content,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setText("");

    // Send to server (adjust payload for your protocol)
    try {
      await client.sendJson({
        action: "onchat",
        data: {
          event: "MESSAGE",
          data: { text: content },
        },
      });
    } catch {
      // If send fails, you may want to show an error or mark message as failed.
    }
  }

  return (
    <section className="chatWindow">
      <header className="chatWindow__header">
        <div className="chatWindow__title">{title}</div>
        <div style={{ marginLeft: "auto", opacity: 0.7, fontSize: 12 }}>
          {connected ? "online" : "connecting..."}
        </div>
      </header>

      <div className="chatWindow__body">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      <footer className="chatWindow__footer">
        <form className="chatWindow__composer" onSubmit={onSubmit}>
          <input
            className="chatWindow__input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
          />
          <button
            className="chatWindow__send"
            type="submit"
            disabled={!canSend}
          >
            Send
          </button>
        </form>
      </footer>
    </section>
  );
}
