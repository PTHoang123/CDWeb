import React, { useMemo, useState } from "react";
import MessageBubble from "./MessageBubble";
import "./chatWindow.css";

export default function ChatWindow({ title = "Chat", initialMessages }) {
  const [text, setText] = useState("");

  const [messages, setMessages] = useState(
    () =>
      initialMessages ?? [
        {
          id: "m1",
          side: "left",
          author: "Huy lofi",
          content: "Tôi bị ngu",
          time: "20:28",
        },
        {
          id: "m2",
          side: "left",
          author: "Hải Bánh",
          content: "chim tao bé",
          time: "20:28",
        },
        { id: "m3", side: "right", content: "ahihi", time: "20:28" },
        { id: "m4", side: "right", content: "bruh", time: "20:28" },
        {
          id: "m5",
          side: "right",
          content: "đẹp trai nhất group",
          time: "20:28",
        },
      ]
  );

  const canSend = useMemo(() => text.trim().length > 0, [text]);

  function onSubmit(e) {
    e.preventDefault();
    if (!canSend) return;

    const next = {
      id: `${Date.now()}`,
      side: "right",
      content: text.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, next]);
    setText("");
  }

  return (
    <section className="chatWindow">
      <header className="chatWindow__header">
        <div className="chatWindow__title">{title}</div>
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
