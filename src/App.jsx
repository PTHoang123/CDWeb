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
    const [showInfo, setShowInfo] = useState(true);

    if (!user) {
        return <Login onLoginSuccess={(userData) => setUser(userData)} />;
    }

    // LOGIC HIỂN THỊ TÊN: Ưu tiên displayName (Tên Google) -> username (Nick/Email)
    const displayName = user.displayName || user.username || "User";

    return (
        <ChatLayout
            navigation={<Sidebar user={user} />}
            sidebar={<ConversationList />}
            chat={
                <ChatWindow
                    // Sửa dòng này:
                    title={`Đang chat: ${displayName}`}
                    onToggleInfo={() => setShowInfo(!showInfo)}
                />
            }
            infochat={showInfo ?
                <InfoChat
                    user={user}
                    currentName={displayName} /> : null}
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