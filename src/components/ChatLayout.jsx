import React from "react";
import "./chatLayout.css";

/**
 * ChatLayout
 * - Left: sidebar (conversations/search)
 * - Center: chat (messages + composer)
 * - Right: details/empty panel (optional)
 *
 * Pass React nodes via props so you can build UI incrementally.
 */
export default function ChatLayout({ sidebar, chat, details, className = "" }) {
  return (
    <div className={`chatLayout ${className}`.trim()}>
      <aside className="chatLayout__sidebar">{sidebar}</aside>

      <main className="chatLayout__main">{chat}</main>
    </div>
  );
}
