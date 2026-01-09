// src/App.jsx
import React, { useState } from "react";
import ChatLayout from "./components/ChatLayout";
import Sidebar from "./components/Navigation/Sidebar";
import ChatWindow from "./components/ChatWindow/ChatWindow.jsx";
import ConversationList from "./components/ConversationList/ConversationList.jsx";
import InfoChat from "./components/InfoChat-Reposity/InfoChatAndRepo.jsx";
import "./App.css";
import Login from "./login/login.jsx";
import Register from "./login/Register.jsx";
import { WsProvider } from "./context/WsContext";
// Import hook useWs để lấy client gửi lệnh logout
import useWs from "./context/useWs";
import { logoutOverWs } from "./api/wsAuth";

const WS_URL = "wss://chat.longapp.site/chat/chat";

function AppInner() {
  // 1. Lấy client WebSocket từ context
  const { client } = useWs();

  const [user, setUser] = useState(null);
  const [authPage, setAuthPage] = useState("login");
  const [showInfo, setShowInfo] = useState(true);

  // 2. Định nghĩa hàm xử lý Logout
  const handleLogout = () => {
    // Gửi lệnh lên server (nếu server cần biết user đã thoát)
    logoutOverWs(client);

    // Xóa token firebase nếu có (do bên Login.jsx có set)
    localStorage.removeItem("firebase_id_token");

    // Quan trọng nhất: Set user về null để React render lại trang Login
    setUser(null);
    setAuthPage("login");
  };

  if (!user) {
    if (authPage === "register") {
      return <Register onBackToLogin={() => setAuthPage("login")} />;
    }
    return (
        <Login
            onLoginSuccess={(userData) => setUser(userData)}
            onGoRegister={() => setAuthPage("register")}
        />
    );
  }

  const displayName = user.displayName || user.username || "User";

  return (
      <ChatLayout
          // 3. Truyền prop onLogout xuống Sidebar
          navigation={<Sidebar user={user} onLogout={handleLogout} />}

          sidebar={<ConversationList />}
          chat={
            <ChatWindow
                title={`Đang chat: ${user.username ?? user.displayName ?? "User"}`}
                onToggleInfo={() => setShowInfo(!showInfo)}
            />
          }
          infochat={showInfo ? <InfoChat user={user} currentName={displayName} /> : null}
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