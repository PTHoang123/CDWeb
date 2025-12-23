import ChatLayout from "./components/ChatLayout";
import Sidebar from "./components/Navigation/Sidebar";
import ChatWindow from "./components/ChatWindow/ChatWindow.jsx";
import "./App.css";

function App() {
    return (
        <ChatLayout
            navigation={<Sidebar/>}  // thanh công cụ
            sidebar={<div>Danh sánh tin nhắn chờ</div>}// để tạm tạm trước
            chat={<ChatWindow title="Hội anh em 36"/>}
        />
    );
}
import React, { useState } from 'react';
import './loginStyle.css';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Bạn có thể thêm kiểm tra email/password thật ở đây
    if (email && password) {
      onLoginSuccess();
    } else {
      alert("Vui lòng điền đầy đủ thông tin!");
    }
  };

  return (
      <div className="login-container">
        <div className="login-card">
          <h2>Chat App Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email..."
                  required
              />
            </div>
            <div className="form-group">
              <label>Mật khẩu</label>
              <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  required
              />
            </div>
            <button type="submit" className="btn-login">Đăng nhập</button>
          </form>
        </div>
      </div>
  );
};

export default Login;

export default App;
