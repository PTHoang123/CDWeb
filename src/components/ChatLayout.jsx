import React from "react";
import "./chatLayout.css";

export default function ChatLayout({ sidebar, chat, className = "" }) {
  return (
    <div className={`chatLayout ${className}`.trim()}>
      <aside className="chatLayout__sidebar">{sidebar}</aside>

      <main className="chatLayout__main">{chat}</main>
    </div>
  );
}
