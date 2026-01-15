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
  const { client, user, setUser, connected } = useWs();

  // const [user, setUser] = useState(null);
  const [authPage, setAuthPage] = useState("login");
  const [showInfo, setShowInfo] = useState(true);
  const [activeChat, setActiveChat] = useState({
    type: "room",
    to: "36",
    name: "Anh em 36",
    key: "room:36",
  });

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

  // if (!user) {
  //   if (authPage === "register") {
  //     return <Register onBackToLogin={() => setAuthPage("login")} />;
  //   }
  //   return (
  //     <Login
  //       onLoginSuccess={(userData) => setUser(userData)}
  //       onGoRegister={() => setAuthPage("register")}
  //     />
  //   );
  // }
    // Login render
    if (!user) {
        if (!connected) return <div>Đang kết nối WebSocket…</div>;
        if (authPage === "register") {
            return <Register onBackToLogin={() => setAuthPage("login")} />;
        }
        return <Login onGoRegister={() => setAuthPage("register")} />;
    }


    const displayName = user.displayName || user.username || "User";

  return (
    <ChatLayout
      // 3. Truyền prop onLogout xuống Sidebar
      navigation={<Sidebar user={user} onLogout={handleLogout} />}
      sidebar={
        <ConversationList
          selectedKey={activeChat?.key}
          onSelectConversation={(c) => setActiveChat(c)}
          currentUsername={user?.username}
        />
      }
      chat={
        <ChatWindow
          title={`Đang chat: ${
            activeChat?.name ?? user.username ?? user.displayName ?? "User"
          }`}
          onToggleInfo={() => setShowInfo(!showInfo)}
          chatType={activeChat?.type ?? "room"}
          chatTo={activeChat?.to ?? "36"}
        />
      }
      infochat={
        showInfo ? <InfoChat user={user} currentName={displayName} /> : null
      }
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
