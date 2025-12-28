import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Contact, CheckSquare, Cloud, Settings, Monitor, ExternalLink } from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import './sidebar.css';

const Sidebar = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const dropdownRef = useRef(null);

    // Đóng menu khi bấm ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div style={{ position: 'relative', display: 'flex' }}>
            <div className="sidebar-nav">
                <div className="user-profile-avatar" onClick={() => setShowDropdown(!showDropdown)}>
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
                    <div className="nav-item"><Settings size={24} /></div>
                </div>
            </div>

            {/* Bảng list ẩn xuất hiện kế bên Avatar */}
            {showDropdown && (
                <div className="sidebar-dropdown" ref={dropdownRef}>
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

            {/* Modal đè lên Chat Window */}
            {showProfileModal && (
                <UserProfileModal onClose={() => setShowProfileModal(false)} />
            )}
        </div>
    );
};

export default Sidebar;