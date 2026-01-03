import React, { useState, useEffect } from "react";
import ChatLayout from "./components/ChatLayout";
import Sidebar from "./components/Navigation/Sidebar";
import ChatWindow from "./components/ChatWindow/ChatWindow.jsx";
import ConversationList from "./components/ConversationList/ConversationList.jsx";
import InfoChat from "./components/InfoChat-Reposity/InfoChatAndRepo.jsx";
import "./App.css";
import Login from "./login/login.jsx";
import { WsProvider } from "./context/WsContext";
import useWs from "./context/useWs";         // Import thêm
import { loginOverWs } from "./api/wsAuth"; // Import thêm để tự đăng nhập

const WS_URL = "wss://chat.longapp.site/chat/chat";

function AppInner() {
    const { client, connected } = useWs(); // Lấy client để login ngầm
    const [user, setUser] = useState(null);
    const [showInfo, setShowInfo] = useState(true);
    const [isRestoring, setIsRestoring] = useState(true); // Trạng thái đang khôi phục session

    // --- LOGIC TỰ ĐỘNG ĐĂNG NHẬP ---
    useEffect(() => {
        const restoreSession = async () => {
            // Lấy thông tin đã lưu
            const savedCreds = localStorage.getItem("chat_creds");

            // Nếu không có hoặc chưa kết nối WS thì thôi
            if (!savedCreds || !connected || !client) {
                if(connected) setIsRestoring(false); // Chỉ tắt loading khi WS đã sẵn sàng mà ko có data
                return;
            }

            try {
                const { user: savedUser, pass: savedPass } = JSON.parse(savedCreds);
                console.log("Đang khôi phục phiên đăng nhập cho:", savedUser);

                // Gọi API đăng nhập lại
                const res = await loginOverWs(client, savedUser, savedPass);
                if (res) {
                    // Nếu là Google Login, ta cần fake lại displayName nếu có lưu (đơn giản hoá thì lấy từ server)
                    // Ở đây ta dùng data từ server trả về là đủ dùng
                    setUser(res);
                }
            } catch (err) {
                console.error("Lỗi khôi phục session:", err);
                // Nếu lỗi (đổi pass, lỗi server...) thì xóa data cũ đi
                localStorage.removeItem("chat_creds");
            } finally {
                setIsRestoring(false);
            }
        };

        restoreSession();
    }, [connected, client]); // Chạy lại khi kết nối thành công

    // Màn hình chờ khi đang tự đăng nhập
    if (isRestoring && !user) {
        return (
            <div style={{
                height: "100vh", display: "flex", justifyContent: "center", alignItems: "center",
                background: "#0b0f16", color: "#fff", flexDirection: "column", gap: 10
            }}>
                <div className="logo react" style={{animation: 'logo-spin infinite 2s linear', width: 50, height: 50, border: '5px solid #0068ff', borderTopColor: 'transparent', borderRadius: '50%'}}></div>
                <div>Đang kết nối lại...</div>
            </div>
        );
    }

    if (!user) {
        return <Login onLoginSuccess={(userData) => setUser(userData)} />;
    }

    const displayName = user.displayName || user.username || "User";

    return (
        <ChatLayout
            navigation={<Sidebar user={user} />}
            sidebar={<ConversationList />}
            chat={
                <ChatWindow
                    title={`Đang chat: ${displayName}`}
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