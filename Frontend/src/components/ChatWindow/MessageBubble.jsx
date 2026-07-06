import React from "react";
import { FileText, Download, Sticker, Smile, Image as ImageIcon, Volume2 } from "lucide-react"; // Bổ sung icon Volume2 nếu muốn dùng
import { safeDecode } from "../../api/utils"; // 1. NHỚ IMPORT HÀM GIẢI MÃ CỦA BẠN VÀO ĐÂY
import "./messageBubble.css";

export default function MessageBubble({ message, onImageClick }) {
  const side = message?.side === "right" ? "right" : "left";

  // Hàm render nội dung tùy theo loại tin nhắn
  const renderContent = () => {
    // 2. GIẢI MÃ NỘI DUNG TRƯỚC KHI XỬ LÝ (Áp dụng cho tin nhắn Text/Voice truyền qua trường content/mes)
    const rawContent = safeDecode(message?.content || message?.mes);

    // XỬ LÝ TIN NHẮN THOẠI (VOICE)
    // Nếu nội dung chứa đường dẫn uploads/voice, nhận diện và render trình phát nhạc luôn
    if (typeof rawContent === 'string' && rawContent.includes("/uploads/voice/")) {
      return (
        <div className="msg__voice-box">
          <div className="msg__voice-info">
            <Volume2 size={18} />
            <span>Tin nhắn thoại {message?.duration ? `(${message.duration}s)` : ""}</span>
          </div>
          {/* Kết nối cổng 8082 của Spring Boot Backend */}
          <audio controls src={`http://localhost:8082${rawContent}`} className="msg__audio-player" />
        </div>
      );
    }

    // Xử lý STICKER
    if (message.type === "sticker") {
      return (
        <img
          src={message.content}
          alt="sticker"
          className="msg__sticker"
          style={{
            width: "120px",
            height: "120px",
            objectFit: "contain",
            cursor: "pointer"
          }}
        />
      );
    }

    // Xử lý ẢNH
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
      const { name, size, data } = message.content || {};

      const handleDownload = () => {
        if (!data) return;
        const link = document.createElement("a");
        link.href = data; 
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

    // Xử lý TEXT (Sử dụng chuỗi đã được giải mã font/emoji chuẩn)
    return <div className="msg__text">{renderTextWithLinks(rawContent)}</div>;
  };

  const renderTextWithLinks = (text) => {
    if (typeof text !== 'string') return ""; 
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

          {/* Bong bóng chat */}
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