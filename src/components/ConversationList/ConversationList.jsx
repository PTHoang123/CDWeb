import React, { useState } from "react";
import { Search, UserPlus, Users, X } from "lucide-react";
import Modal from "../Modal/Modal";
import "./conversationList.css";

const MOCK_CONVERSATIONS = [
    { id: 1, name: "Huy lofi", avatar: "https://ui-avatars.com/api/?name=Huy", msg: "Mày bị ngu à", time: "20:28" },
    { id: 2, name: "Hải bánh", avatar: "https://ui-avatars.com/api/?name=Hai", msg: "Chim tao bé", time: "20:28" },
    { id: 3, name: "Anh em 36", avatar: "https://ui-avatars.com/api/?name=36", msg: "36 mãi đỉnh", time: "1 giờ" },
];

const MOCK_SEARCH_RESULTS = [
    { id: 101, name: "Nguyễn Văn A", phone: "0987654321", avatar: "https://ui-avatars.com/api/?name=A" },
    { id: 102, name: "Trần Thị B", phone: "0912345678", avatar: "https://ui-avatars.com/api/?name=B" },
    { id: 103, name: "Lê C", phone: "0999888777", avatar: "https://ui-avatars.com/api/?name=C" },
];

const ConversationList = () => {
    const [activeTab, setActiveTab] = useState("priority");
    const [selectedId, setSelectedId] = useState(1);
    const [isOpenAddFriend, setIsOpenAddFriend] = useState(false);
    const [isOpenCreateGroup, setIsOpenCreateGroup] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Hàm giả lập tìm kiếm User
    const handleSearchUser = () => {
        if(!searchTerm) return;
        setIsLoading(true);
        setTimeout(() => {
            setSearchResults(MOCK_SEARCH_RESULTS);
            setIsLoading(false);
        }, 500);
    };

    // Hàm reset lại khi đóng
    const handleCloseModal = () => {
        setIsOpenAddFriend(false);
        setIsOpenCreateGroup(false);
        setSearchTerm("");
        setSearchResults([]);
        setGroupName("");
        setSelectedUsers([]);
    };

    // Hàm chon thành viên
    const toggleUserSelection = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    return (
        <div className="conv-list">
            {/* Header */}
            <div className="conv-header">
                <div className="conv-search-box">
                    <Search size={16} color="#7589a3" />
                    <input type="text" placeholder="Tìm kiếm" className="conv-search-input" />
                </div>
                {/* Bắt sự kiện click mở Modal */}
                <div className="conv-icon-btn" onClick={() => setIsOpenAddFriend(true)} title="Thêm bạn">
                    <UserPlus size={20} />
                </div>
                <div className="conv-icon-btn" onClick={() => setIsOpenCreateGroup(true)} title="Tạo nhóm">
                    <Users size={20} />
                </div>
            </div>

            {/* Tabs */}
            <div className="conv-tabs">
                <div className={`conv-tab ${activeTab === 'priority' ? 'active' : ''}`} onClick={() => setActiveTab('priority')}>
                    Ưu tiên
                </div>
                <div className={`conv-tab ${activeTab === 'other' ? 'active' : ''}`} onClick={() => setActiveTab('other')}>
                    Khác
                </div>
            </div>

            {/* Danh sách tin nhắn */}
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

            {/* Thêm bạn bè */}
            <Modal isOpen={isOpenAddFriend} onClose={handleCloseModal} title="Thêm bạn mới">
                <div className="modal-body-custom">
                    <div className="search-row">
                        <input
                            type="text"
                            className="modal-input"
                            placeholder="Số điện thoại hoặc tên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="btn-primary" onClick={handleSearchUser}>Tìm</button>
                    </div>

                    <div className="result-list">
                        {isLoading ? <div className="loading-text">Đang tìm kiếm...</div> : (
                            searchResults.map(user => (
                                <div key={user.id} className="user-row">
                                    <img src={user.avatar} className="avatar-small" alt=""/>
                                    <div className="user-info">
                                        <div className="user-name">{user.name}</div>
                                        <div className="user-phone">{user.phone}</div>
                                    </div>
                                    <button className="btn-outline">Kết bạn</button>
                                </div>
                            ))
                        )}
                        {/* Gợi ý khi chưa tìm */}
                        {!isLoading && searchResults.length === 0 && (
                            <div className="empty-state">Nhập từ khóa để tìm bạn bè</div>
                        )}
                    </div>
                </div>
            </Modal>

            {/*Tạo nhóm*/}
            <Modal isOpen={isOpenCreateGroup} onClose={handleCloseModal} title="Tạo nhóm chat">
                <div className="modal-body-custom">
                    <div className="input-group">
                        <label>Tên nhóm</label>
                        <input
                            type="text"
                            className="modal-input"
                            placeholder="Nhập tên nhóm..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>Thêm thành viên</label>
                        <div className="search-row">
                            <input
                                type="text"
                                className="modal-input"
                                placeholder="Tìm tên người dùng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="btn-primary" onClick={handleSearchUser}>Tìm</button>
                        </div>
                    </div>

                    <div className="result-list checkable-list">
                        {searchResults.map(user => (
                            <div key={user.id} className="user-row" onClick={() => toggleUserSelection(user.id)}>
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={() => {}}
                                    style={{marginRight: 10}}
                                />
                                <img src={user.avatar} className="avatar-small" alt=""/>
                                <div className="user-info">
                                    <div className="user-name">{user.name}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="modal-footer">
                        <button
                            className="btn-primary full-width"
                            disabled={!groupName || selectedUsers.length < 2}
                        >
                            Tạo nhóm ({selectedUsers.length})
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default ConversationList;