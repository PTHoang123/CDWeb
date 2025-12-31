import React from "react";
import "./chatLayout.css";

export default function ChatLayout({navigation, infochat ,sidebar, chat, className = ""}) {
    return (
        <div className={`chatLayout ${className}`.trim()}>
            {/*  thanh công cụ */}
            <nav className="chatLayout__nav">{navigation}</nav>
            {/* danh sách */}
            <aside className="chatLayout__sidebar">{sidebar}</aside>
            {/* khung chat */}
            <main className="chatLayout__main">{chat}</main>
            {/*/!* Thông tin hội thoại *!/*/}
            <aside className="ChatLayout__info">{infochat}</aside>
        </div>
    );
}
