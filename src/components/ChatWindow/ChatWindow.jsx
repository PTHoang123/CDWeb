import React, { useMemo, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import {
    Smile, Image as ImageIcon, Paperclip, Contact, Scan,
    Type, Zap, CreditCard, MoreHorizontal, ThumbsUp, Send
} from 'lucide-react';
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
    // Xử lý khi bấm nút Like hoặc Send
    const handleQuickAction = () => {
        if (canSend) {
            // Nếu có chữ thì gửi tin nhắn (giả lập submit form)
            document.querySelector('.chatWindow__composer').requestSubmit();
        } else {
            // Nếu không có chữ thì gửi Like (Icon ThumbsUp)
            const next = {
                id: `${Date.now()}`,
                side: "right",
                content: "👍", // Gửi icon like
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages((prev) => [...prev, next]);
        }
    };

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
          {/* Toolbar các chức năng: Gửi ảnh, file, danh thiếp... */}
          <div className="chat-toolbar">
              <div className="toolbar-icon" title="Gửi Sticker"><Smile size={20} /></div>
              <div className="toolbar-icon" title="Gửi Ảnh"><ImageIcon size={20} /></div>
              <div className="toolbar-icon" title="Đính kèm File"><Paperclip size={20} /></div>
              <div className="toolbar-icon" title="Gửi Danh thiếp"><Contact size={20} /></div>
              <div className="toolbar-icon" title="Chụp màn hình"><Scan size={20} /></div>
              <div className="toolbar-icon" title="Định dạng tin nhắn"><Type size={20} /></div>
              <div className="toolbar-icon" title="Tin nhắn nhanh"><Zap size={20} /></div>
              <div className="toolbar-icon" title="Ví / Chuyển tiền"><CreditCard size={20} /></div>
              <div className="toolbar-icon" title="Thêm"><MoreHorizontal size={20} /></div>
          </div>
          {/* Khu vực nhập liệu */}
        <form className="chatWindow__composer" onSubmit={onSubmit}>
          <input
            className="chatWindow__input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
          />
            <div className="chat-input-actions">
                {/* Icon Emoji nằm trong ô nhập (bên phải) */}
                <div className="action-icon-small" title="Biểu cảm">
                    <Smile size={20} />
                </div>

                {/* Nút Gửi hoặc Like */}
                <div className="action-icon-large" onClick={handleQuickAction} title={canSend ? "Gửi" : "Gửi Like"}>
                    {canSend ? <Send size={20} color="#0068ff" /> : <ThumbsUp size={20} color="#e5a50a" />}
                </div>
            </div>
        </form>
      </footer>
    </section>
  );
}
