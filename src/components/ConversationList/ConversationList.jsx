import React, { useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";
import "./conversationList.css";

const MOCK_CONVERSATIONS = [
    { id: 1, name: "Huy lofi", avatar: "https://ui-avatars.com/api/?name=Huy", msg: "Mày bị ngu à", time: "20:28" },
    { id: 2, name: "Hải bánh", avatar: "https://ui-avatars.com/api/?name=Hai", msg: "Chim tao bé", time: "20:28" },
    { id: 3, name: "Anh em 36", avatar: "https://ui-avatars.com/api/?name=36", msg: "36 mãi đỉnh", time: "1 giờ" },
];

const ConversationList = () => {
    const [activeTab, setActiveTab] = useState("priority");
    // 2. Đã sửa lỗi chính tả setSelectedId
    const [selectedId, setSelectedId] = useState(1);

    return (
        <div className="conv-list">
            <div className="conv-header">
                <div className="conv-search-box">
                    <Search size={16} color="#7589a3" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm"
                        className="conv-search-input"
                    />
                </div>
                <div className="conv-icon-btn"><UserPlus size={20} /></div>
                <div className="conv-icon-btn"><Users size={20} /></div>
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
                {MOCK_CONVERSATIONS.map((item) => (
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