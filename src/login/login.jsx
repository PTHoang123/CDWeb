import React, { useState, useEffect } from "react";
import "./loginStyle.css";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import useWs from "../context/useWs";
import { loginOverWs, reloginOverWs } from "../api/wsAuth";

const Login = ({ onLoginSuccess, onGoRegister }) => {
  const { client, connected } = useWs();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // State kiểm soát việc đang tự động đăng nhập
  const [isRelogging, setIsRelogging] = useState(true);

  // Danh sách tài khoản mẫu theo yêu cầu của bạn
  const demoAccounts = [
    { name: "Đức Hải", user: "duchai", pass: "12345" },
    { name: "Tiến Hoàng", user: "tienhoang", pass: "12345" },
    { name: "Thanh Huy", user: "thanhhuy", pass: "12345" },
    { name: "Giảng viên", user: "long", pass: "12345" },
  ];
  useEffect(() => {
    // Chỉ chạy khi WebSocket đã kết nối
    if (!connected || !client) return;

    const checkAutoLogin = async () => {
      // Lấy thông tin đã lưu từ lần đăng nhập trước
      const savedUser = localStorage.getItem("chat_user");
      const savedCode = localStorage.getItem("chat_relogin_code");

      if (savedUser && savedCode) {
        console.log("Phát hiện phiên cũ, đang khôi phục kết nối...");
        try {
          // Gọi API Relogin
          const res = await reloginOverWs(client, savedUser, savedCode);

          if (res && res.status === "success") {
            console.log("Relogin thành công!");
            // Gọi hàm success để vào màn hình Chat ngay lập tức
            onLoginSuccess(res.data || { username: savedUser });
            return; // Kết thúc, không chạy xuống phần tắt loading
          }
        } catch (err) {
          console.warn("Relogin thất bại (hết hạn hoặc lỗi):", err.message);
          // Nếu lỗi, xóa token cũ để tránh thử lại vô ích
          localStorage.removeItem("chat_relogin_code");
        }
      }

      // Nếu không có token hoặc relogin thất bại, tắt màn hình chờ
      setIsRelogging(false);
    };

    checkAutoLogin();
  }, [connected, client, onLoginSuccess]);

  const handleSubmit = async (e, autoUser = null, autoPass = null) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const finalUser = autoUser || username;
      const finalPass = autoPass || password;

      // Gọi hàm đăng nhập qua WS
      const res = await loginOverWs(client, finalUser, finalPass);

      // QUAN TRỌNG: Kiểm tra res có dữ liệu không
      if (res) {
        console.log("Dữ liệu User nhận được:", res);
        // Lưu username và code để dùng cho relogin sau này
        localStorage.setItem("chat_user", res.username);
        if (res.RE_LOGIN_CODE) {
          localStorage.setItem("chat_relogin_code", res.RE_LOGIN_CODE);
        }
        onLoginSuccess(res); // Lúc này App.jsx mới nhận được user và chuyển trang
      } else {
        setError("Server trả về dữ liệu trống");
      }
    } catch (err) {
      setError(err.message || "Sai tài khoản hoặc mật khẩu");
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
      const idToken = await user.getIdToken();
      localStorage.setItem("firebase_id_token", idToken);

      const wsUsernameSuggestion = (
        user.email?.split("@")[0] || user.uid
      ).slice(0, 20);

      onLoginSuccess({
        provider: "google",
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        avatar: user.photoURL,
        wsUsernameSuggestion,
      });
    } catch (err) {
      // Common cases: popup closed, unauthorized domain, config missing
      setError(err?.message || "Google login failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  if (isRelogging && localStorage.getItem("chat_relogin_code")) {
    return (
        <div className="login-body-wrapper">
          <div style={{ color: "white", textAlign: "center", marginTop: "20vh" }}>
            <h3>Đang khôi phục kết nối...</h3>
            <p style={{ fontSize: 13, opacity: 0.7 }}>Vui lòng đợi trong giây lát</p>
          </div>
        </div>
    );
  }

  return (
    <div className="login-body-wrapper">
      <div className="login-container">
        <div className="app-title">Chatify</div>
        <div className="subtitle">Chọn tài khoản mẫu hoặc nhập tay</div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <button
            type="button"
            onClick={onGoRegister}
            style={{ cursor: "pointer" }}
          >
            Create account
          </button>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            WS: {connected ? "online" : "connecting..."}
          </span>
        </div>

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
            cursor: googleLoading ? "wait" : "pointer",
            marginBottom: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "7px",
            opacity: googleLoading ? 0.7 : 1
          }}
        >
          <img
              src="https://imagepng.org/wp-content/uploads/2019/08/google-icon.png"
              alt="Google Logo"
              style={{ width: "20px", height: "20px" }}
          />
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
