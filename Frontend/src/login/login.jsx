import React, { useState, useEffect, useRef } from "react";
import "./loginStyle.css";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import useWs from "../context/useWs";
import { loginOverWs, reloginOverWs } from "../api/wsAuth";

// THÊM onLoginSuccess VÀO
const IMG_WELCOME = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44b.png"; // Ảnh Hi/Welcome
const IMG_SAD = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f622.png";
const Login = ({ onGoRegister, onLoginSuccess }) => {
    const { client, connected, setUser } = useWs();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);

    const [isRelogging, setIsRelogging] = useState(true);
    const hasTriedRelogin = useRef(false);

    // --- LOGIC TỰ ĐỘNG ĐĂNG NHẬP (RE-LOGIN) ---
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
            } catch {
                setIsRelogging(false); return;
            }

            console.log("🚀 Đang khôi phục phiên cho:", savedProfile.username);

            try {
                // Gọi API Relogin
                const res = await reloginOverWs(client, savedProfile.username, savedCode);

                if (res && res.status === "success") {
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

                    // Gọi callback để App.jsx biết
                    if (onLoginSuccess) {
                        onLoginSuccess(finalUserData);
                    } else {
                        // Fallback nếu không có prop onLoginSuccess (dùng context cũ)
                        setUser(finalUserData);
                    }
                } else {
                    throw new Error(res.mes || "Failed");
                }
            } catch (err) {
                console.error("❌ Relogin thất bại:", err);
                localStorage.removeItem("chat_relogin_code");
                localStorage.removeItem("chat_user_profile");
                setIsRelogging(false);
            }
        };

        checkAutoLogin();
    }, [connected, client, onLoginSuccess, setUser]);

    // --- LOGIC ĐĂNG NHẬP THƯỜNG ---
    const handleSubmit = async (e, autoUser = null, autoPass = null) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const finalUser = (autoUser || username).trim();
            const finalPass = (autoPass || password).trim();

            // Reset cờ relogin để lần sau F5 lại chạy được logic check
            hasTriedRelogin.current = false;

            const res = await loginOverWs(client, finalUser, finalPass);

            if (res) {
                console.log("Login thành công:", res);

                // Lưu profile vào localStorage
                localStorage.setItem("chat_user_profile", JSON.stringify(res));

                if (res.RE_LOGIN_CODE) {
                    localStorage.setItem("chat_relogin_code", res.RE_LOGIN_CODE);
                }

                if (onLoginSuccess) {
                    onLoginSuccess(res);
                } else {
                    setUser(res);
                }
            }
        } catch (err) {
            setError(err.message || "Sai tài khoản hoặc mật khẩu");
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIC ĐĂNG NHẬP GOOGLE ---
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

            const userData = {
                provider: "google",
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                avatar: user.photoURL,
                wsUsernameSuggestion,
            };

            // Dùng onLoginSuccess để đồng bộ
            if (onLoginSuccess) {
                onLoginSuccess(userData);
            } else {
                setUser(userData);
            }

        } catch (err) {
            setError(err?.message || "Google login failed");
        } finally {
            setGoogleLoading(false);
        }
    };

    // 1. MÀN HÌNH CHỜ KHI ĐANG CHECK RELOGIN
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

    // 2. MÀN HÌNH FORM ĐĂNG NHẬP
    return (
        <div className="login-body-wrapper">
            <div className="login-container">
                <div className="app-title">Chatify</div>
                <div className="subtitle">Đăng nhập bằng google hoặc nhập tay</div>

                <div className="top-action-bar">
                    <button
                        type="button"
                        onClick={onGoRegister}
                        className="btn-outline" // Class mới thêm
                    >
                        Create Account
                    </button>

                    <span className="ws-status">
                        WS: {connected ? "Online 🟢" : "Connecting... 🟠"}
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

                <div className="mascot-container">
                    <img
                        // Nếu có lỗi -> Ảnh Sad, ngược lại -> Ảnh Welcome
                        src={error ? IMG_SAD : IMG_WELCOME}
                        alt="Status Mascot"
                        className="mascot-img"
                    />
                </div>

                {/* Khu vực nút đăng nhập nhanh */}
                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "15px",
                        flexWrap: "wrap",
                    }}
                >

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