import React, { useState } from "react";
import ChatLayout from "./components/ChatLayout";
import Sidebar from "./components/Navigation/Sidebar";
import ChatWindow from "./components/ChatWindow/ChatWindow.jsx";
import Login from "./login/login.jsx";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  // Nếu chưa đăng nhập, trả về trang Login
  if (!user) {
    return <Login onLoginSuccess={(userData) => setUser(userData)} />;
  }
  console.log("User logged in:", user);
  // Đã đăng nhập thành công
  return (
    <ChatLayout
      navigation={<Sidebar user={user} />}
      sidebar={<div>Danh sách bạn bè</div>}
      chat={<ChatWindow title={`Đang chat: ${user.username}`} />}
    />
  );
}

export default App;
