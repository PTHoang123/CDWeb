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
    if (
    message.type === "voice" || 
    (typeof rawContent === 'string' && rawContent.endsWith(".webm"))
  ) {
    return (
      <div className="msg__voice-box">
        <div className="msg__voice-info">
          <Volume2 size={18} />
          <span>Tin nhắn thoại {message?.duration ? `(${message.duration}s)` : ""}</span>
        </div>
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
    if (
    message.type === "file" || 
    (typeof rawContent === 'string' && (rawContent.endsWith(".pdf") || rawContent.includes("file_url")))
  ) {
    // Chỗ này bạn lấy thông tin file ra để render ô Download
    // Nếu trong DB lưu chuỗi JSON thô của filePayload thì bạn JSON.parse(rawContent) ra nhé
    let fileData = message.content || {};
    if (typeof rawContent === 'string' && rawContent.startsWith("{")) {
       try { fileData = JSON.parse(rawContent); } catch(e){}
    }

    const name = fileData.name || rawContent.split('/').pop(); // Lấy tạm tên file từ đường dẫn nếu thiếu
    const size = fileData.size || "Unknown";
    const downloadUrl = fileData.data || `http://localhost:8082${rawContent}`;

    return (
        <div className="msg__file-box">
          <div className="msg__file-icon">
            <FileText size={32} color="#fff" />
          </div>
          <div className="msg__file-info">
            <div className="msg__file-name">{name}</div>
            <div className="msg__file-size">{size}</div>
          </div>
          <a className="msg__file-download" href={downloadUrl} download={name} target="_blank" rel="noreferrer" title="Tải xuống">
            <Download size={20} color="#fff" />
          </a>
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