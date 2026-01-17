import React, { useState, useEffect, useRef } from "react";
import {
    MessageSquare, Contact, CheckSquare, Cloud, Settings, Monitor, ExternalLink,
    User, Database, Globe, HelpCircle, ChevronRight, Check
} from 'lucide-react';
import { Emoji, EmojiStyle } from 'emoji-picker-react';
import UserProfileModal from './UserProfileModal';
import './sidebar.css';

const Sidebar = ({ user, onLogout}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    // Các state menu cũ giữ nguyên
    const [showSettingDropdown, setShowSettingDropdown] = useState(false);
    const [activeSubMenu, setActiveSubMenu] = useState(null);
    const [currentLang, setCurrentLang] = useState('vi');
    const [showDataOther, setShowDataOther] = useState(false);

    const profileRef = useRef(null);
    const settingsRef = useRef(null);

    // Đóng menu khi bấm ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target) &&
                !event.target.closest('.user-profile-avatar')) {
                setShowDropdown(false);
            }
            if (settingsRef.current && !settingsRef.current.contains(event.target) &&
                !event.target.closest('.settings-trigger')) {
                setShowSettingDropdown(false);
                setActiveSubMenu(null); // Reset submenu khi đóng
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);

    }, []);
// Nếu user.avatar rỗng thì dùng ảnh tạo tự động theo tên
    const avatarSrc = user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || "User"}&background=random`;
    const userName = user?.displayName || user?.username || "User";

    const handleToggleSettings = () => {
        setShowSettingDropdown(!showSettingDropdown);
        setShowDropdown(false);
        setActiveSubMenu(null); // Reset submenu khi mở lại
    }

    // --- XỬ LÝ DỮ LIỆU USER ---

    return (
        <div style={{ position: 'relative', display: 'flex' }}>
            {/* --- SIDEBAR NAV (Giữ nguyên) --- */}
            <div className="sidebar-nav">
                <div className="user-profile-avatar" onClick={() => {setShowDropdown(!showDropdown); setShowSettingDropdown(false);}}>
                    <img
                        src={avatarSrc}
                        alt="Avatar"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/150"; // Ảnh dự phòng nếu link lỗi
                        }}
                    />
                </div>
                <div className="nav-menu-items">
                    <div className="nav-item active"><MessageSquare size={26} /></div>
                    <div className="nav-item"><Contact size={26} /></div>
                </div>
                <div className="nav-group-bottom">
                    <div className="nav-item"><CheckSquare size={26} /></div>
                    <div className="nav-item"><Cloud size={24} /></div>
                    <div className="nav-item"><Monitor size={24} /></div>
                    <div className={`nav-item settings-trigger ${showSettingDropdown ? 'active' : ''}`} onClick={handleToggleSettings}>
                        <Settings size={24}/>
                    </div>
                </div>
            </div>

            {/* --- PROFILE MENU --- */}
            {showDropdown && (
                <div className="sidebar-dropdown profile-menu" ref={profileRef}>
                    <div className="dropdown-header">{userName}</div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item"><span>Nâng cấp tài khoản</span><ExternalLink size={14} /></div>
                    <div className="dropdown-item" onClick={() => { setShowProfileModal(true); setShowDropdown(false); }}>Hồ sơ của bạn</div>
                    <div className="dropdown-item">Cài đặt</div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item logout" onClick={() => {
                        setShowDropdown(false); // Đóng menu cho gọn
                        onLogout();
                    }}>Đăng xuất</div>
                </div>
            )}

            {/* --- SETTINGS MENU (Đã cập nhật) --- */}
            {showSettingDropdown && (
                <div className="sidebar-dropdown settings-menu" ref={settingsRef}>

                    <div className="dropdown-item" onMouseEnter={() => setActiveSubMenu(null)}>
                        <div className="item-label" onClick={() => { setShowProfileModal(true); setShowDropdown(false); }}><User size={18} /> <span>Thông tin tài khoản</span></div>
                    </div>

                    <div className="dropdown-item" onMouseEnter={() => setActiveSubMenu(null)}>
                        <div className="item-label"><Settings size={18} /> <span>Cài đặt</span></div>
                    </div>

                    {/* --- MỤC DỮ LIỆU --- */}
                    <div className="dropdown-item has-arrow" onMouseEnter={() => setActiveSubMenu('data')}>
                        <div className="item-label"><Database size={18} /> <span>Dữ liệu</span></div>
                        <ChevronRight size={16} className="arrow-icon"/>

                        {/* Submenu Dữ liệu */}
                        {activeSubMenu === 'data' && (
                            <div className="sub-dropdown">
                                <div className="dropdown-item">Đồng bộ tin nhắn</div>
                                <div className="dropdown-item">Quản lý dữ liệu</div>
                                <div className="dropdown-divider"></div>

                                {/* Menu cấp 3: Khác */}
                                <div className="dropdown-item has-arrow"
                                     onMouseEnter={() => setShowDataOther(true)}
                                     onMouseLeave={() => setShowDataOther(false)}
                                >
                                    <span>Khác</span>
                                    <ChevronRight size={16} className="arrow-icon"/>

                                    {showDataOther && (
                                        <div className="sub-dropdown level-3">
                                            <div className="dropdown-item">Xuất dữ liệu</div>
                                            <div className="dropdown-item">Nhập dữ liệu</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- MỤC NGÔN NGỮ --- */}
                    <div className="dropdown-item has-arrow" onMouseEnter={() => setActiveSubMenu('language')}>
                        <div className="item-label"><Globe size={18} /> <span>Ngôn ngữ</span></div>
                        <ChevronRight size={16} className="arrow-icon"/>

                        {/* Submenu Ngôn ngữ */}
                        {activeSubMenu === 'language' && (
                            <div className="sub-dropdown">
                                <div className="dropdown-item" onClick={() => setCurrentLang('vi')}>
                                    <div className="item-label">
                                        <Emoji
                                            unified="1f1fb-1f1f3" // Mã của cờ Việt Nam
                                            size={22}
                                            emojiStyle={EmojiStyle.APPLE} // Style Apple trông đẹp và bóng bẩy nhất (giống Zalo)
                                        />
                                        <span style={{marginLeft: '8px'}}>Tiếng Việt</span>
                                    </div>
                                    {currentLang === 'vi' && <Check size={16} color="#0068ff" />}
                                </div>

                                <div className="dropdown-item" onClick={() => setCurrentLang('en')}>
                                    <div className="item-label">
                                        <Emoji
                                            unified="1f1fa-1f1f8" // Mã của cờ Mỹ
                                            size={22}
                                            emojiStyle={EmojiStyle.APPLE}
                                        />
                                        <span style={{marginLeft: '8px'}}>English</span>
                                    </div>
                                    {currentLang === 'en' && <Check size={16} color="#0068ff" />}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- MỤC HỖ TRỢ --- */}
                    <div className="dropdown-item has-arrow" onMouseEnter={() => setActiveSubMenu('support')}>
                        <div className="item-label"><HelpCircle size={18} /> <span>Hỗ trợ</span></div>
                        <ChevronRight size={16} className="arrow-icon"/>

                        {/* Submenu Hỗ trợ */}
                        {activeSubMenu === 'support' && (
                            <div className="sub-dropdown support-pos">
                                <div className="dropdown-item">Thông tin phiên bản</div>
                                <div className="dropdown-item">Liên hệ</div>
                                <div className="dropdown-item">Gửi file log tới AppChat</div>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-item">Phím tắt</div>
                            </div>
                        )}
                    </div>

                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item logout"
                         onMouseEnter={() => setActiveSubMenu(null)}
                         onClick={onLogout} // <--- Thêm dòng này
                    >
                        <span className="logout-text">Đăng xuất</span>
                    </div>
                </div>
            )}

            {showProfileModal && (
                <UserProfileModal
                    user={user}
                    onClose={() => setShowProfileModal(false)} />
            )}
        </div>
    );
};

export default Sidebar;