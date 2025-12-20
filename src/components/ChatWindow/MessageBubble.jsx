import React from "react";
import "./messageBubble.css";

export default function MessageBubble({ message }) {
  const side = message?.side === "right" ? "right" : "left";

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
            <div className="msg__text">{message?.content}</div>
            {message?.time && <div className="msg__time">{message.time}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
