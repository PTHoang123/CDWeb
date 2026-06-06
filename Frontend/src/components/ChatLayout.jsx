import React from "react";
import "./chatLayout.css";

export default function ChatLayout({navigation, infochat ,sidebar, chat, className = ""}) {
    // Kiểm tra xem có infochat hay không (check null)
    const hasInfo = !!infochat;
    return (
        <div className={`chatLayout ${!hasInfo ? 'chatLayout--full' : ''} ${className}`.trim()}>
            {/*  thanh công cụ */}
            <nav className="chatLayout__nav">{navigation}</nav>
            {/* danh sách */}
            <aside className="chatLayout__sidebar">{sidebar}</aside>
            {/* khung chat */}
            <main className="chatLayout__main">{chat}</main>
            {/*/!* Thông tin hội thoại *!/*/}
            {hasInfo && (
                <aside className="chatLayout__info">{infochat}</aside>
            )}
        </div>
    );
}
