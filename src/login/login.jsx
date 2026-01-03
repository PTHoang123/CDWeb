import React, { useState } from "react";
import "./loginStyle.css";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import useWs from "../context/useWs";
import { loginOverWs } from "../api/wsAuth";

const Login = ({ onLoginSuccess }) => {
  const { client, connected } = useWs();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // State riêng cho nút Google để không ảnh hưởng form chính
  const [googleLoading, setGoogleLoading] = useState(false);

  // Danh sách tài khoản mẫu
  const demoAccounts = [
    { name: "Đức Hải", user: "duchai", pass: "12345" },
    { name: "Tiến Hoàng", user: "tienhoang", pass: "12345" },
    { name: "Thanh Huy", user: "thanhhuy", pass: "12345" },
    { name: "Giảng viên", user: "long", pass: "12345" },
  ];

  // --- HÀM XỬ LÝ ĐĂNG NHẬP THƯỜNG ---
  const handleSubmit = async (e, autoUser = null, autoPass = null) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const finalUser = autoUser || username;
      const finalPass = autoPass || password;

      // Gọi hàm đăng nhập qua WS
      const res = await loginOverWs(client, finalUser, finalPass);

      if (res) {
        onLoginSuccess(res);
      } else {
        setError("Server trả về dữ liệu trống");
      }
    } catch (err) {
      setError(err.message || "Sai tài khoản hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM XỬ LÝ ĐĂNG NHẬP GOOGLE (Cải tiến) ---
  const handleGoogleLogin = async () => {
    // Reset lỗi cũ
    setError("");
    setGoogleLoading(true);

    try {
      // 1. Đăng nhập qua Firebase (Google) trước
      const cred = await signInWithPopup(auth, googleProvider);
      const googleUser = cred.user; // Lấy được thông tin Google

      // Chuẩn bị dữ liệu user mặc định từ Google
      let finalUserData = {
        id: googleUser.uid, // Dùng tạm ID của google
        username: googleUser.email,
        displayName: googleUser.displayName || googleUser.email,
        avatar: googleUser.photoURL,
        email: googleUser.email
      };

      // 2. Nếu có kết nối WS, cố gắng đồng bộ để người khác tìm kiếm được
      if (connected && client) {
        try {
          const GOOGLE_DEFAULT_PASS = "GoogleLogin@123";
          const email = googleUser.email;

          // Bước 2a: Gửi lệnh Đăng ký (Fire & Forget - không chờ kqua)
          // Mục đích: Nếu chưa có thì tạo mới, có rồi thì thôi.
          client.sendJson({
            action: "onchat",
            data: {
              event: "REGISTER",
              data: { user: email, pass: GOOGLE_DEFAULT_PASS }
            }
          }).catch(e => console.warn("Lỗi gửi lệnh Register:", e));

          // Bước 2b: Chờ xíu cho Server xử lý (500ms)
          await new Promise(r => setTimeout(r, 500));

          // Bước 2c: Thử Đăng nhập vào Server Chat
          const wsRes = await loginOverWs(client, email, GOOGLE_DEFAULT_PASS, { timeoutMs: 3000 });

          // Nếu đăng nhập WS thành công, dùng data chuẩn từ Server Chat
          if (wsRes) {
            console.log("Đồng bộ Server Chat thành công!");
            finalUserData = {
              ...wsRes,
              // Ưu tiên hiển thị Avatar/Tên từ Google cho đẹp nếu Server chưa có
              avatar: googleUser.photoURL || wsRes.avatar,
              displayName: googleUser.displayName || wsRes.username
            };
          }
        } catch (wsErr) {
          // Nếu lỗi kết nối Server Chat (do sai pass cũ, do server lag...)
          // TA VẪN CHO ĐĂNG NHẬP (Fallback) để không chặn người dùng
          console.warn("Không thể login vào Chat Server, dùng chế độ Offline:", wsErr);
        }
      }

      // 3. Hoàn tất đăng nhập
      onLoginSuccess(finalUserData);

    } catch (err) {
      console.error("Lỗi Google Login:", err);
      // Chỉ hiện lỗi nếu thất bại ngay từ bước Firebase (bước quan trọng nhất)
      if (err.code) {
        setError("Hủy đăng nhập hoặc lỗi Google.");
      }
    } finally {
      // Luôn luôn tắt loading để nút bấm hoạt động lại được
      setGoogleLoading(false);
    }
  };

  return (
      <div className="login-body-wrapper">
        <div className="login-container">
          <div className="app-title">Chatify</div>
          <div className="subtitle">Chọn tài khoản mẫu hoặc nhập tay</div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            WS: {connected ? <span style={{color: '#4caf50'}}>Online</span> : <span style={{color: 'orange'}}>Connecting...</span>}
          </span>
          </div>

          {/* Google login */}
          <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading} // Chỉ disable khi đang xử lý
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(255,255,255,.08)",
                color: "inherit",
                cursor: googleLoading ? "wait" : "pointer",
                marginBottom: 12,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                opacity: googleLoading ? 0.7 : 1
              }}
          >
            {googleLoading ? "Đang xử lý..." : "Tiếp tục với Google"}
          </button>

          {/* Khu vực nút đăng nhập nhanh */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexWrap: "wrap" }}>
            {demoAccounts.map((acc) => (
                <button
                    key={acc.user}
                    type="button"
                    onClick={() => handleSubmit(null, acc.user, acc.pass)}
                    style={{ padding: "4px 8px", fontSize: "12px", cursor: "pointer" }}
                >
                  {acc.name}
                </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
                <div style={{ color: "#ff4d4f", fontSize: "13px", marginBottom: "10px", background: 'rgba(255,0,0,0.1)', padding: '5px', borderRadius: '4px' }}>
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