// MessageBubble.jsx
import React from "react";
import { FileText, Download, Sticker,
    Smile, Image as ImageIcon, } from "lucide-react"; // Import icon
import "./messageBubble.css";

export default function MessageBubble({ message, onImageClick }) {
  const side = message?.side === "right" ? "right" : "left";

  // Hàm render nội dung tùy theo loại tin nhắn
  const renderContent = () => {
      // Xử lý STICKER
      if (message.type === "sticker") {
          return (
              <img
                  src={message.content}
                  alt="sticker"
                  className="msg__sticker"
                  // Sticker thường to hơn emoji và không cần bo góc hay border như ảnh chụp
                  style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "contain",
                      cursor: "pointer"
                  }}
              />
          );
      }
    // Xử lý ẢNH
      if (message.type === "image") {
          return (
              <img
                  src={message.content}
                  alt="sent image"
                  className="msg__image"
                  style={{ maxWidth: "200px", borderRadius: "8px", cursor: "pointer" }}

                  onClick={(e) => {
                      e.stopPropagation();
                      if (onImageClick) {
                          onImageClick(message);
                      } else {
                          console.warn("Chưa truyền onImageClick vào MessageBubble");
                      }
                  }}
              />
          );
      }

    // Xử lý FILE
    if (message.type === "file") {
      // message.content lúc này là Object: { name, size, data, ... }
      const { name, size, data } = message.content || {};

      const handleDownload = () => {
        if (!data) return;
        const link = document.createElement("a");
        link.href = data; // data là chuỗi Base64
        link.download = name || "file";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      return (
          <div className="msg__file-box">
            <div className="msg__file-icon">
              <FileText size={32} color="#fff" />
            </div>
            <div className="msg__file-info">
              <div className="msg__file-name">{name}</div>
              <div className="msg__file-size">{size}</div>
            </div>
            <div className="msg__file-download" onClick={handleDownload} title="Tải xuống">
              <Download size={20} color="#fff" />
            </div>
          </div>
      );
    }

    // Xử lý TEXT
    return <div className="msg__text">{renderTextWithLinks(message?.content)}</div>;
  };

  const renderTextWithLinks = (text) => {
    if (typeof text !== 'string') return ""; // Bảo vệ chống lỗi nếu content là object
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
            <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="msg__link" onClick={(e) => e.stopPropagation()}>
              {part}
            </a>
        );
      }
      return part;
    });
  };

    return (
        <div className={`msg msg--${side}`}>
            <div className="msg__row">
                {side === "left" && (
                    <div className="msg__avatar">{message?.author?.[0]?.toUpperCase() ?? "A"}</div>
                )}
                <div className="msg__stack">

                    {/* Hiển thị tên người gửi (Chỉ hiện cho tin nhắn bên trái) */}
                    {side === "left" && message?.author && (
                        <div className="msg__author">{message.author}</div>
                    )}

                    {/* Bong bóng chat (Giữ nguyên logic cũ) */}
                    <div
                        className={
                            message.type === "sticker"
                                ? "msg__sticker-container"
                                : `msg__bubble msg__bubble--${side}`
                        }
                    >
                        {renderContent()}
                        {message?.time && <div className="msg__time">{message.time}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}