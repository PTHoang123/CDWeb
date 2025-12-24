import React, { useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";
import "./conversationList.css";

const ConversationList = () => {
    const [activeTab, setActiveTab] = useState("priority"); // 'priority' hoặc 'other'

    return (
        <div className="conv-list">
            {/* 1. Header Tìm kiếm */}
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

            {/* 2. Tabs phân loại */}
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

            {/* Placeholder: Chỗ này sẽ chứa danh sách tin nhắn sau này */}
            <div style={{padding: 20, textAlign: 'center', color: '#999'}}>
                Danh sách đang trống...
            </div>
        </div>
    );
};

export default ConversationList;