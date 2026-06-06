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
import useWs from "./context/useWs";
import { logoutOverWs } from "./api/wsAuth";

const WS_URL = "wss://chat.longapp.site/chat/chat";

function AppInner() {

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
  const [sharedMessages, setSharedMessages] = useState([]);

  // --- [SỬA ĐỔI QUAN TRỌNG: LOGOUT] ---
  const handleLogout = () => {
    // 1. Gửi lệnh logout lên server
    logoutOverWs(client);

    // 2. Xóa thông tin đăng nhập tự động để tránh relogin ngay lập tức
    localStorage.removeItem("firebase_id_token");
    localStorage.removeItem("chat_user");
    localStorage.removeItem("chat_relogin_code");
    localStorage.removeItem("chat_user_profile");

    // 3. Reset state để về trang Login
    setUser(null);
    setAuthPage("login");
  };
  // ------------------------------------

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
          // để biết tên hiện tại là ai
          currentUsername={user?.username}
          onMessagesUpdate={(msgs) => setSharedMessages(msgs)}

        />
      }
      infochat={
        showInfo ? (
          <InfoChat
            activeChat={activeChat}
            user={user}
            currentName={displayName}
            allMessages={sharedMessages}
          />
        ) : null
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