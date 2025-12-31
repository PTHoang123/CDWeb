import React, { useState } from "react";
import ChatLayout from "./components/ChatLayout";
import Sidebar from "./components/Navigation/Sidebar";
import ChatWindow from "./components/ChatWindow/ChatWindow.jsx";
import ConversationList from "./components/ConversationList/ConversationList.jsx";
import InfoChat from "./components/InfoChat-Reposity/InfoChatAndRepo.jsx";
import "./App.css";
import Login from "./login/login.jsx";
import { WsProvider } from "./context/WsContext";

const WS_URL = "wss://chat.longapp.site/chat/chat";

function AppInner() {
    const [user, setUser] = useState(null);
    // State quản lý việc ẩn/hiện cột thông tin bên phải
    const [showInfo, setShowInfo] = useState(true);

    // Nếu chưa đăng nhập, trả về trang Login
    if (!user) {
        return <Login onLoginSuccess={(userData) => setUser(userData)} />;
    }

    // Đã đăng nhập thành công
    return (
        <ChatLayout
            navigation={<Sidebar user={user} />}
            sidebar={<ConversationList />}
            chat={
                <ChatWindow
                    title={`Đang chat: ${user.username ?? user.displayName ?? "User"}`}
                    // Truyền hàm toggle xuống ChatWindow
                    onToggleInfo={() => setShowInfo(!showInfo)}
                />
            }
            // Nếu showInfo = true thì hiện InfoChat, ngược lại thì null (ẩn)
            infochat={showInfo ? <InfoChat /> : null}
        />
    );
}

function App() {
    return (
        <WsProvider url={WS_URL}>
            <AppInner />
        </WsProvider>
    );
}

export default App;