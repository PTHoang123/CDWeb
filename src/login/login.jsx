<<<<<<< HEAD
import React, {useState} from "react";
=======
import React, { useState, useEffect, useRef } from "react";
>>>>>>> 62613a387664fbec3036d201b28368e5d86f825b
import "./loginStyle.css";
import {signInWithPopup} from "firebase/auth";
import {auth, googleProvider} from "../firebase";
import useWs from "../context/useWs";
<<<<<<< HEAD
import {loginOverWs} from "../api/wsAuth";
=======
import { loginOverWs, reloginOverWs } from "../api/wsAuth";
>>>>>>> 62613a387664fbec3036d201b28368e5d86f825b

const Login = ({onGoRegister}) => {
    const {client, connected, setUser} = useWs();

<<<<<<< HEAD
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);

    // Danh sách tài khoản mẫu theo yêu cầu của bạn
    const demoAccounts = [
        {name: "Đức Hải", user: "duchai", pass: "12345"},
        {name: "Tiến Hoàng", user: "tienhoang", pass: "12345"},
        {name: "Thanh Huy", user: "thanhhuy", pass: "12345"},
        {name: "Giảng viên", user: "long", pass: "12345"},
    ];

    const handleSubmit = async (e, autoUser = null, autoPass = null) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError("");
=======
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isRelogging, setIsRelogging] = useState(true);

  // Chốt chặn để không chạy Relogin 2 lần
  const hasTriedRelogin = useRef(false);

  const demoAccounts = [
    { name: "Đức Hải", user: "duchai", pass: "12345" },
    { name: "Tiến Hoàng", user: "tienhoang", pass: "12345" },
    { name: "Thanh Huy", user: "thanhhuy", pass: "12345" },
    { name: "Giảng viên", user: "long", pass: "12345" },
  ];

  // --- [FIX] Logic Tự động đăng nhập ---
  useEffect(() => {
    if (!connected || !client || hasTriedRelogin.current) return;

    const checkAutoLogin = async () => {
      // 1. Lấy chuỗi JSON profile đã lưu
      const savedProfileStr = localStorage.getItem("chat_user_profile");
      const savedCode = localStorage.getItem("chat_relogin_code");

      if (!savedProfileStr || !savedCode) {
        setIsRelogging(false);
        return;
      }

      hasTriedRelogin.current = true;
      let savedProfile = {};
      try {
        savedProfile = JSON.parse(savedProfileStr);
      } catch (e) {
        setIsRelogging(false); return;
      }

      console.log("🚀 Đang khôi phục phiên cho:", savedProfile.username);

      try {
        // Gọi API Relogin
        const res = await reloginOverWs(client, savedProfile.username, savedCode);

        if (res && res.status === "success") {
          // Server có thể trả về thông tin user mới nhất, hoặc không.
          // Ta ưu tiên dùng data từ server, nếu thiếu thì bù bằng data đã lưu (savedProfile)
          const svData = res.data || {};
          const finalUserData = {
            ...savedProfile, // Dữ liệu cũ (avatar, name...)
            ...svData        // Dữ liệu mới từ server (nếu có)
          };

          // Nếu server cấp code mới thì lưu lại
          if (svData.RE_LOGIN_CODE) {
            localStorage.setItem("chat_relogin_code", svData.RE_LOGIN_CODE);
          }

          // Cập nhật lại profile mới nhất vào localStorage
          localStorage.setItem("chat_user_profile", JSON.stringify(finalUserData));

          onLoginSuccess(finalUserData);
        } else {
          throw new Error(res.mes || "Failed");
        }
      } catch (err) {
        console.error("❌ Relogin thất bại:", err);
        localStorage.removeItem("chat_relogin_code");
        localStorage.removeItem("chat_user_profile"); // Xóa profile lỗi
        setIsRelogging(false);
      }
    };

    checkAutoLogin();
  }, [connected, client, onLoginSuccess]);

  const handleSubmit = async (e, autoUser = null, autoPass = null) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
>>>>>>> 62613a387664fbec3036d201b28368e5d86f825b

        try {
            const finalUser = autoUser || username;
            const finalPass = autoPass || password;

<<<<<<< HEAD
            // Gọi hàm đăng nhập qua WS
            const res = await loginOverWs(client, finalUser, finalPass);

            // QUAN TRỌNG: Kiểm tra res có dữ liệu không
            if (res) {
                console.log("Dữ liệu User nhận được:", res);
                localStorage.setItem("chat_user", finalUser);
                if (res.RE_LOGIN_CODE) {
                    localStorage.setItem("chat_relogin_code", res.RE_LOGIN_CODE);
                    localStorage.removeItem("chat_pass");
                } else {
                    localStorage.setItem("chat_pass", finalPass);
                }
                // onLoginSuccess(res); // Lúc này App.jsx mới nhận được user và chuyển trang
                setUser({
                    username: finalUser,
                    ...res,
                });
            }
        } catch (err) {
            setError(err.message || "Sai tài khoản hoặc mật khẩu");
        } finally {
            setLoading(false);
        }
    };
=======
      // Reset cờ relogin để lần sau F5 lại chạy được
      hasTriedRelogin.current = false;

      const res = await loginOverWs(client, finalUser, finalPass);

      if (res) {
        console.log("Login thành công:", res);

        // --- [QUAN TRỌNG] Lưu toàn bộ object user vào localStorage ---
        localStorage.setItem("chat_user_profile", JSON.stringify(res));

        if (res.RE_LOGIN_CODE) {
          localStorage.setItem("chat_relogin_code", res.RE_LOGIN_CODE);
        }
        onLoginSuccess(res);
      }
    } catch (err) {
      setError(err.message || "Sai tài khoản hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };
>>>>>>> 62613a387664fbec3036d201b28368e5d86f825b

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setError("");

<<<<<<< HEAD
        try {
            const cred = await signInWithPopup(auth, googleProvider);
            const user = cred.user;

            const idToken = await user.getIdToken();
            localStorage.setItem("firebase_id_token", idToken);

            // IMPORTANT:
            // Google login is only Firebase Auth. Your WS server still needs a WS username.
            // Strategy (simple): let Google login through Firebase, then use email prefix as suggested WS username.
            const wsUsernameSuggestion = (
                user.email?.split("@")[0] || user.uid
            ).slice(0, 20);
=======
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;
      const idToken = await user.getIdToken();
      localStorage.setItem("firebase_id_token", idToken);

      const wsUsernameSuggestion = (
        user.email?.split("@")[0] || user.uid
      ).slice(0, 20);
>>>>>>> 62613a387664fbec3036d201b28368e5d86f825b

            // onLoginSuccess({
            //   provider: "google",
            //   uid: user.uid,
            //   email: user.email,
            //   displayName: user.displayName,
            //   avatar: user.photoURL,
            //   wsUsernameSuggestion,
            // });
            setUser({
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

<<<<<<< HEAD
    return (
        <div className="login-body-wrapper">
            <div className="login-container">
                <div className="app-title">Chatify</div>
                <div className="subtitle">Chọn tài khoản mẫu hoặc nhập tay</div>
=======
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
>>>>>>> 62613a387664fbec3036d201b28368e5d86f825b

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
                        style={{cursor: "pointer"}}
                    >
                        Create account
                    </button>
                    <span style={{fontSize: 12, opacity: 0.7}}>
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
                        style={{width: "20px", height: "20px"}}
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
                            style={{color: "red", fontSize: "13px", marginBottom: "10px"}}
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
