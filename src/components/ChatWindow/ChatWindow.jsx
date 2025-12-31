import React, { useMemo, useState, useRef, useEffect } from "react"; // 1. Import thêm useRef, useEffect
import MessageBubble from "./MessageBubble.jsx";
import {
    Smile, Image as ImageIcon, Paperclip, Contact, Scan,
    Type, Zap, CreditCard, MoreHorizontal, ThumbsUp, Send,
    Search, PanelRightClose
} from 'lucide-react';
import "./chatWindow.css";

export default function ChatWindow({ title = "Chat", initialMessages, onToggleInfo }) {
    const [text, setText] = useState("");
    const [messages, setMessages] = useState(
        () => initialMessages ?? [
            { id: "m1", side: "left", author: "Huy lofi", content: "Tôi bị ngu", time: "20:28" },
            { id: "m2", side: "left", author: "Hải Bánh", content: "chim tao bé", time: "20:28" },
            { id: "m3", side: "right", content: "ahihi", time: "20:28" },
            { id: "m4", side: "right", content: "bruh", time: "20:28" },
            { id: "m5", side: "right", content: "đẹp trai nhất group", time: "20:28" },
        ]
    );

    // 2. Tạo ref để tham chiếu đến cuối danh sách chat
    const messagesEndRef = useRef(null);

    // 3. Hàm cuộn xuống dưới cùng
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 4. Gọi hàm cuộn mỗi khi danh sách messages thay đổi
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const canSend = useMemo(() => text.trim().length > 0, [text]);

    function onSubmit(e) {
        e.preventDefault();
        if (!canSend) return;

        const next = {
            id: `${Date.now()}`,
            side: "right",
            content: text.trim(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, next]);
        setText("");
        // useEffect sẽ tự chạy sau khi state messages thay đổi nên không cần gọi scrollToBottom ở đây
    }

    const handleQuickAction = () => {
        if (canSend) {
            document.querySelector('.chatWindow__composer').requestSubmit();
        } else {
            const next = {
                id: `${Date.now()}`,
                side: "right",
                content: "👍",
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages((prev) => [...prev, next]);
        }
    };

    return (
        <section className="chatWindow">
            <header className="chatWindow__header">
                <div className="chatWindow__header-info">
                    <div className="chatWindow__title">{title}</div>
                    <div className="chatWindow__subtitle">Vừa truy cập</div>
                </div>

                <div className="chatWindow__header-actions">
                    <div className="header-icon" title="Tìm kiếm tin nhắn">
                        <Search size={22} />
                    </div>
                    <div className="header-icon" title="Thông tin hội thoại" onClick={onToggleInfo}>
                        <PanelRightClose size={22} />
                    </div>
                </div>
            </header>

            <div className="chatWindow__body">
                {messages.map((m) => (
                    <MessageBubble key={m.id} message={m} />
                ))}
                {/* 5. Thêm thẻ div rỗng này ở cuối danh sách để làm điểm neo cuộn tới */}
                <div ref={messagesEndRef} />
            </div>

            <footer className="chatWindow__footer">
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

                <form className="chatWindow__composer" onSubmit={onSubmit}>
                    <input
                        className="chatWindow__input"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={`Nhập @, tin nhắn tới ${title}`}
                    />

                    <div className="chat-input-actions">
                        <div className="action-icon-small" title="Biểu cảm">
                            <Smile size={20} />
                        </div>
                        <div className="action-icon-large" onClick={handleQuickAction} title={canSend ? "Gửi" : "Gửi Like"}>
                            {canSend ? <Send size={20} color="#0068ff" /> : <ThumbsUp size={20} color="#e5a50a" />}
                        </div>
                    </div>
                </form>
            </footer>
        </section>
    );
}