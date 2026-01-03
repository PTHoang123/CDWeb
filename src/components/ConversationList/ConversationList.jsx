import React, { useState, useEffect } from "react";
import { Search, UserPlus, Users } from "lucide-react";
import "./conversationList.css";
// Import hook useWs để giao tiếp với Server
import useWs from "../../context/useWs";

const MOCK_CONVERSATIONS = [
    { id: 1, name: "Huy lofi", avatar: "https://ui-avatars.com/api/?name=Huy", msg: "Mày bị ngu à", time: "20:28" },
    { id: 2, name: "Hải bánh", avatar: "https://ui-avatars.com/api/?name=Hai", msg: "Chim tao bé", time: "20:28" },
    { id: 3, name: "Anh em 36", avatar: "https://ui-avatars.com/api/?name=36", msg: "36 mãi đỉnh", time: "1 giờ" },
];

const ConversationList = () => {
    // 1. Lấy client từ WebSocket Context
    const { client } = useWs();

    const [activeTab, setActiveTab] = useState("priority");
    const [selectedId, setSelectedId] = useState(1);

    // 2. State cho việc tìm kiếm
    const [keyword, setKeyword] = useState("");
    const [foundUser, setFoundUser] = useState(null); // Lưu thông tin người tìm thấy từ API
    const [searchError, setSearchError] = useState(""); // Lưu thông báo lỗi nếu không tìm thấy

    // 3. Lắng nghe phản hồi từ Server (CHECK_USER_EXIST)
    useEffect(() => {
        if (!client) return;

        const handleMessage = (response) => {
            // Kiểm tra nếu event là CHECK_USER_EXIST
            if (response.event === "CHECK_USER_EXIST") {
                if (response.status === "success") {
                    // Tìm thấy người dùng
                    setFoundUser(response.data);
                    setSearchError("");
                } else {
                    // Không tìm thấy
                    setFoundUser(null);
                    setSearchError("Không tìm thấy người dùng này!");
                }
            }
        };

        // Đăng ký lắng nghe: hàm .on() trả về hàm cleanup (off)
        const off = client.on("json", handleMessage);

        // Cleanup function: Gọi hàm off() khi component unmount
        return () => {
            off();
        };
    }, [client]);

    // 4. Hàm xử lý khi nhấn Enter ở ô tìm kiếm
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && keyword.trim().length > 0) {
            // Xóa kết quả cũ
            setFoundUser(null);
            setSearchError("");

            // Gửi yêu cầu lên server
            client.sendJson({
                action: "onchat",
                data: {
                    event: "CHECK_USER_EXIST",
                    data: {
                        user: keyword.trim() // Gửi tên user hoặc gmail người dùng nhập
                    }
                }
            });
        }
    };

    // Hàm chọn người dùng tìm thấy để chat
    const handleSelectFoundUser = () => {
        if(!foundUser) return;
        console.log("Bắt đầu chat với:", foundUser);
        // Ở đây bạn sẽ thêm logic chuyển sang màn hình chat hoặc thêm vào danh sách chat
        // Ví dụ: setSelectedId(foundUser.id) hoặc gọi API tạo phòng chat
        alert(`Đã chọn chat với: ${foundUser.username || keyword}`);
    };

    return (
        <div className="conv-list">
            <div className="conv-header">
                <div className="conv-search-box">
                    <Search size={16} color="#7589a3" />
                    <input
                        type="text"
                        placeholder="Tìm email/user (Enter để tìm)"
                        className="conv-search-input"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                {/* Giữ nguyên phần icon bên phải */}
                <div className="conv-icon-btn">
                    <UserPlus size={18} />
                </div>
                <div className="conv-icon-btn">
                    <Users size={18} />
                </div>
            </div>

            <div className="conv-tabs">
                <div
                    className={`conv-tab ${activeTab === 'priority' ? 'active' : ''}`}
                    onClick={() => setActiveTab('priority')}
                >
                    Ưu tiên
                </div>
                <div
                    className={`conv-tab ${activeTab === 'other' ? 'active' : ''}`}
                    onClick={() => setActiveTab('other')}
                >
                    Khác
                </div>
            </div>

            <div className="conv-items-scroll">
                {/* --- PHẦN HIỂN THỊ KẾT QUẢ TÌM KIẾM TỪ API --- */}
                {keyword && (
                    <div style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                        <small style={{ color: "#888" }}>Kết quả tìm kiếm online:</small>

                        {searchError && (
                            <div style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>
                                {searchError}
                            </div>
                        )}

                        {foundUser && (
                            <div
                                className="conv-item active"
                                style={{ background: "#e6f7ff", marginTop: "5px" }}
                                onClick={handleSelectFoundUser}
                            >
                                {/* Hiển thị avatar mặc định nếu không có */}
                                <img
                                    src={foundUser.avatar || `https://ui-avatars.com/api/?name=${foundUser.username || keyword}`}
                                    alt="avt"
                                    className="conv-avatar"
                                />
                                <div className="conv-content">
                                    <div className="conv-row-top">
                                        <span className="conv-name">
                                            {foundUser.username || keyword} (Mới)
                                        </span>
                                        <span className="conv-time">Ngay bây giờ</span>
                                    </div>
                                    <div className="conv-message" style={{color: '#0084ff'}}>
                                        Nhấn để bắt đầu trò chuyện
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- DANH SÁCH HỘI THOẠI CŨ (GIỮ NGUYÊN) --- */}
                {MOCK_CONVERSATIONS
                    // Có thể thêm logic filter local ở đây nếu muốn tìm cả trong list cũ
                    .filter(item => item.name.toLowerCase().includes(keyword.toLowerCase()))
                    .map((item) => (
                        <div
                            key={item.id}
                            className={`conv-item ${selectedId === item.id ? 'active' : ''}`}
                            onClick={() => setSelectedId(item.id)}
                        >
                            <img src={item.avatar} alt="avt" className="conv-avatar" />
                            <div className="conv-content">
                                <div className="conv-row-top">
                                    <span className="conv-name">{item.name}</span>
                                    <span className="conv-time">{item.time}</span>
                                </div>
                                <div className="conv-message">{item.msg}</div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default ConversationList;