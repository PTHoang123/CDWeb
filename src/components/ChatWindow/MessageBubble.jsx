import React from "react";
import "./messageBubble.css";

export default function MessageBubble({ message }) {
  const side = message?.side === "right" ? "right" : "left";
  const renderTextWithLinks = (text) => {
    if (!text) return "";

    // Regex tìm link bắt đầu bằng http hoặc https
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Tách chuỗi văn bản dựa trên link
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      // Nếu phần này khớp với regex link -> render thẻ <a>
      if (part.match(urlRegex)) {
        return (
            <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="msg__link" // Class này để style bên CSS
                onClick={(e) => e.stopPropagation()} // Ngăn việc click link bị tính là click vào tin nhắn
            >
              {part}
            </a>
        );
      }
      // Nếu là chữ thường
      return part;
    });
  };
  return (
      <div className={`msg msg--${side}`}>
        <div className="msg__row">
          {side === "left" && (
              <div className="msg__avatar" aria-hidden="true">
                {message?.author?.[0]?.toUpperCase?.() ?? "A"}
              </div>
          )}

          <div className="msg__content">
            {side === "left" && message?.author && (
                <div className="msg__author">{message.author}</div>
            )}

            <div className={`msg__bubble msg__bubble--${side}`}>
              {/* THAY ĐỔI Ở ĐÂY: Gọi hàm render thay vì hiển thị trực tiếp */}
              <div className="msg__text">
                {renderTextWithLinks(message?.content)}
              </div>

              {message?.time && <div className="msg__time">{message.time}</div>}
            </div>
          </div>
        </div>
      </div>
  );
}
