import React, { useState, useEffect, useRef } from "react";
import {
    MessageSquare, Contact, CheckSquare, Cloud, Settings, Monitor, ExternalLink,
    User, Database, Globe, HelpCircle, LogOut, ChevronRight, Power
} from 'lucide-react'; // Import thêm các icon cần thiết
import UserProfileModal from './UserProfileModal';
import './sidebar.css';

const Sidebar = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showSettingDropdown, setShowSettingDropdown] = useState(false);

    // Sử dụng 2 ref riêng biệt để tránh xung đột
    const profileRef = useRef(null);
    const settingsRef = useRef(null);

    // Đóng menu khi bấm ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Xử lý đóng Profile Dropdown
            if (profileRef.current && !profileRef.current.contains(event.target) &&
                !event.target.closest('.user-profile-avatar')) {
                setShowDropdown(false);
            }
            // Xử lý đóng Settings Dropdown
            if (settingsRef.current && !settingsRef.current.contains(event.target) &&
                !event.target.closest('.settings-trigger')) {
                setShowSettingDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Hàm toggle để đảm bảo chỉ mở 1 menu tại 1 thời điểm
    const handleToggleProfile = () => {
        setShowDropdown(!showDropdown);
        setShowSettingDropdown(false);
    }

    const handleToggleSettings = () => {
        setShowSettingDropdown(!showSettingDropdown);
        setShowDropdown(false);
    }

    return (
        <div style={{ position: 'relative', display: 'flex' }}>
            <div className="sidebar-nav">
                <div className="user-profile-avatar" onClick={handleToggleProfile}>
                    <img src="https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/482752udT/anh-mo-ta.png" alt="profile" />
                </div>

                <div className="nav-menu-items">
                    <div className="nav-item active"><MessageSquare size={26} /></div>
                    <div className="nav-item"><Contact size={26} /></div>
                </div>

                <div className="nav-group-bottom">
                    <div className="nav-item"><CheckSquare size={26} /></div>
                    <div className="nav-item"><Cloud size={24} /></div>
                    <div className="nav-item"><Monitor size={24} /></div>
                    {/* Thêm class settings-trigger để định danh nút bấm */}
                    <div className={`nav-item settings-trigger ${showSettingDropdown ? 'active' : ''}`} onClick={handleToggleSettings}>
                        <Settings size={24}/>
                    </div>
                </div>
            </div>

            {/* --- MENU PROFILE (Giữ nguyên cũ) --- */}
            {showDropdown && (
                <div className="sidebar-dropdown profile-menu" ref={profileRef}>
                    <div className="dropdown-header">Đức Hải</div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item">
                        <span>Nâng cấp tài khoản</span>
                        <ExternalLink size={14} />
                    </div>
                    <div className="dropdown-item" onClick={() => { setShowProfileModal(true); setShowDropdown(false); }}>
                        Hồ sơ của bạn
                    </div>
                    <div className="dropdown-item">Cài đặt</div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item logout">Đăng xuất</div>
                </div>
            )}

            {/* --- MENU SETTINGS (Mới - Giống Zalo) --- */}
            {showSettingDropdown && (
                <div className="sidebar-dropdown settings-menu" ref={settingsRef}>

                    <div className="dropdown-item">
                        <div className="item-label"><User size={18} /> <span>Thông tin tài khoản</span></div>
                    </div>

                    <div className="dropdown-item">
                        <div className="item-label"><Settings size={18} /> <span>Cài đặt</span></div>
                    </div>

                    <div className="dropdown-divider"></div>

                    <div className="dropdown-item has-arrow">
                        <div className="item-label"><Database size={18} /> <span>Dữ liệu</span></div>
                        <ChevronRight size={16} className="arrow-icon"/>
                    </div>

                    <div className="dropdown-item has-arrow">
                        <div className="item-label"><Globe size={18} /> <span>Ngôn ngữ</span></div>
                        <ChevronRight size={16} className="arrow-icon"/>
                    </div>

                    <div className="dropdown-item has-arrow">
                        <div className="item-label"><HelpCircle size={18} /> <span>Hỗ trợ</span></div>
                        <ChevronRight size={16} className="arrow-icon"/>
                    </div>

                    <div className="dropdown-divider"></div>

                    <div className="dropdown-item logout">
                        <span className="logout-text">Đăng xuất</span>
                    </div>

                    <div className="dropdown-item">
                        <span>Thoát</span>
                    </div>

                </div>
            )}

            {/* Modal đè lên Chat Window */}
            {showProfileModal && (
                <UserProfileModal onClose={() => setShowProfileModal(false)} />
            )}
        </div>
    );
};

export default Sidebar;