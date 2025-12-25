import React, { useState } from "react";
import "./loginStyle.css";
import { loginWithWS } from "../api/auth";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Danh sách tài khoản mẫu theo yêu cầu của bạn
  const demoAccounts = [
    { name: "Đức Hải", user: "duchai", pass: "12345" },
    { name: "Tiến Hoàng", user: "tienhoang", pass: "12345" },
    { name: "Thanh Huy", user: "thanhhuy", pass: "12345" },
    { name: "Giảng viên", user: "long", pass: "12345" },
  ];

  const handleSubmit = async (e, autoUser = null, autoPass = null) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    const finalUser = autoUser || username;
    const finalPass = autoPass || password;

    try {
      const result = await loginWithWS(finalUser, finalPass);

      // Lưu mã RE_LOGIN_CODE để dùng sau này
      localStorage.setItem("relogin_code", result.userData.RE_LOGIN_CODE);

      // Truyền thông tin user và socket về App.jsx
      onLoginSuccess({
        username: finalUser,
        socket: result.socket,
        provider: "password",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;

      // You can store token if needed
      const idToken = await user.getIdToken();
      localStorage.setItem("firebase_id_token", idToken);

      onLoginSuccess({
        provider: "google",
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    } catch (err) {
      // Common cases: popup closed, unauthorized domain, config missing
      setError(err?.message || "Google login failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-body-wrapper">
      <div className="login-container">
        <div className="app-title">Chatify</div>
        <div className="subtitle">Chọn tài khoản mẫu hoặc nhập tay</div>

        {/* Google login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,.12)",
            background: "rgba(255,255,255,.08)",
            color: "inherit",
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          {googleLoading ? "Signing in..." : "Continue with Google"}
        </button>

        {/* Khu vực nút đăng nhập nhanh */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "15px",
            flexWrap: "wrap",
          }}
        >
          {demoAccounts.map((acc) => (
            <button
              key={acc.user}
              type="button"
              onClick={() => handleSubmit(null, acc.user, acc.pass)}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {acc.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{ color: "red", fontSize: "13px", marginBottom: "10px" }}
            >
              {error}
            </div>
          )}
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username"
              required
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Đang kết nối..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
