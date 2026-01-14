import React, { useState } from 'react';
import {
    Bell, Pin, Users, Edit2, ChevronDown, ChevronLeft,
    Search, Folder, FileText, FileCode, Link as LinkIcon,
    MoreHorizontal, Clock, EyeOff, AlertTriangle, Trash2
} from 'lucide-react';
import './InfoChatAndRepo.css';

// --- MOCK DATA CHO PHẦN INFO (Mình thêm dữ liệu cho đủ > 10 cái để test) ---
const MOCK_PREVIEW_IMAGES = [
    "https://dominhhai.com/wp-content/uploads/2021/06/kiet-tac-cua-thien-nhien-qua-nhung-hinh-anh-dep-6.jpg",
    "https://tse2.mm.bing.net/th/id/OIP.LtCEQVhRFQL7emXb6oLAVAHaE7?w=626&h=417&rs=1&pid=ImgDetMain&o=7&rm=3",
    "https://img.freepik.com/premium-photo/sunlit-scene-overlooking-sakura-plantation-with-many-blooms-view-fudzi-mountain_935074-10748.jpg?w=1060",
    "https://tse2.mm.bing.net/th/id/OIP.LtCEQVhRFQL7emXb6oLAVAHaE7?w=626&h=417&rs=1&pid=ImgDetMain&o=7&rm=3",
    "https://dominhhai.com/wp-content/uploads/2021/06/kiet-tac-cua-thien-nhien-qua-nhung-hinh-anh-dep-6.jpg",
    "https://tse2.mm.bing.net/th/id/OIP.LtCEQVhRFQL7emXb6oLAVAHaE7?w=626&h=417&rs=1&pid=ImgDetMain&o=7&rm=3",
    "https://dominhhai.com/wp-content/uploads/2021/06/kiet-tac-cua-thien-nhien-qua-nhung-hinh-anh-dep-6.jpg",
    "https://tse2.mm.bing.net/th/id/OIP.LtCEQVhRFQL7emXb6oLAVAHaE7?w=626&h=417&rs=1&pid=ImgDetMain&o=7&rm=3",
    "https://dominhhai.com/wp-content/uploads/2021/06/kiet-tac-cua-thien-nhien-qua-nhung-hinh-anh-dep-6.jpg",
    "https://tse2.mm.bing.net/th/id/OIP.LtCEQVhRFQL7emXb6oLAVAHaE7?w=626&h=417&rs=1&pid=ImgDetMain&o=7&rm=3",
];

const MOCK_PREVIEW_FILES = [
    { name: "Snake game", size: "10.01 KB", date: "15/10/2025", type: "folder" },
    { name: "Báo cáo.docx", size: "2.5 MB", date: "14/10/2025", type: "word" },
    { name: "Source_code.zip", size: "15 MB", date: "12/10/2025", type: "zip" },
    { name: "Old_File.pdf", size: "1 MB", date: "01/10/2025", type: "pdf" },
    { name: "Bang_luong_T12.xlsx", size: "1.1 MB", type: "excel" },
];

const MOCK_PREVIEW_LINKS = [
    { title: "ThucHanh05 - Google Drive", url: "drive.google.com" },
    { title: "Tài liệu ReactJS", url: "react.dev" },
    { title: "Thiết kế Figma", url: "figma.com" },
    { title: "Link cũ hơn", url: "google.com" },
    { title: "Github Repository", url: "github.com" },
    { title: "Thiết kế Figma Project A", url: "figma.com" },
    { title: "Tài liệu ReactJS - Trang chủ", url: "react.dev" },
    { title: "Video hướng dẫn Youtube", url: "youtube.com" },
];

// --- MOCK DATA CHI TIẾT CHO KHO LƯU TRỮ (Repo Mode - Giữ nguyên đầy đủ) ---
const REPO_MEDIA_GROUPS = [
    {
        date: "Mới nhất",
        // Lấy 3 ảnh đầu tiên (Index 0, 1, 2)
        items: MOCK_PREVIEW_IMAGES.slice(0, 3)
    },
    {
        date: "28/12/2025",
        // Lấy 5 ảnh tiếp theo (Index 3 đến 7)
        items: MOCK_PREVIEW_IMAGES.slice(3, 8)
    },
    {
        date: "20/12/2025",
        // Lấy 2 ảnh cuối cùng (Index 8, 9)
        items: MOCK_PREVIEW_IMAGES.slice(8, 10)
    }
];

const REPO_FILE_GROUPS = [
    {
        date: "Mới nhất",
        items: MOCK_PREVIEW_FILES.slice(0, 1)
    },
    {
        date: "28/12/2025",
        items: MOCK_PREVIEW_FILES.slice(1, 2)
    },
    {
        date: "20/12/2025",
        items: MOCK_PREVIEW_FILES.slice(2, 5)
    }
];

const REPO_LINK_GROUPS = [
    {
        date: "Mới nhất",
        items: MOCK_PREVIEW_LINKS.slice(0, 1)
    },
    {
        date: "28/12/2025",
        items: MOCK_PREVIEW_LINKS.slice(1, 6)
    },
    {
        date: "20/12/2025",
        items: MOCK_PREVIEW_LINKS.slice(6, 8)
    }
];

export default function InfoChatAndRepo({  activeChat }) {
    const [activeTab, setActiveTab] = useState('info');
    const [activeRepoTab, setActiveRepoTab] = useState('media');
    const [sections, setSections] = useState({
        media: true, files: true, links: true, security: true
    });
    const isRoom = activeChat?.type === 'room';
    const displayName = activeChat?.name || "Cuộc trò chuyện";
    const displayAvatar = isRoom
        ? "https://cdn-icons-png.flaticon.com/512/166/166258.png" // Ảnh mặc định cho Room
        : "https://gcs.tripi.vn/public-tripi/tripi-feed/img/482752udT/anh-mo-ta.png"; // Ảnh mặc định cho User
    const toggleSection = (key) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const openRepoTab = (subTab) => {
        setActiveRepoTab(subTab);
        setActiveTab('repo');
    };

    // ================== RENDER INFO MODE ==================
    const renderInfoMode = () => (
        <>
            <div className="info-profile">
                <img
                    src={displayAvatar}
                    alt="avatar"
                    className="info-avatar-large"
                />
                <div className="info-name-row">
                    <span>{displayName}</span>
                    <Edit2 size={16} color="#7589a3" style={{ cursor: 'pointer' }} />
                </div>

                <div className="info-actions">
                    <div className="action-item">
                        <div className="action-icon-circle"><Bell size={20} /></div>
                        <span>Tắt thông báo</span>
                    </div>
                    <div className="action-item">
                        <div className="action-icon-circle"><Pin size={20} /></div>
                        <span>Ghim hội thoại</span>
                    </div>
                    <div className="action-item">
                        <div className="action-icon-circle"><Users size={20} /></div>
                        <span>Tạo nhóm</span>
                    </div>
                    <div className="action-item">
                        <div className="action-icon-circle"><Search size={20} /></div>
                        <span>Tìm tin nhắn</span>
                    </div>
                </div>
            </div>

            {/* Mục 1: Ảnh / Video (Preview) - HIỂN THỊ TỐI ĐA 8 ẢNH */}
            <div className="info-section">
                <div className="section-header" onClick={() => toggleSection('media')}>
                    <span>Ảnh / Video</span>
                    <ChevronDown size={18} className={`section-arrow ${!sections.media ? 'collapsed' : ''}`} />
                </div>
                {sections.media && (
                    <>
                        <div className="media-preview-grid">
                            {/* Dùng slice(0, 8) để chỉ lấy 8 ảnh đầu tiên */}
                            {MOCK_PREVIEW_IMAGES.slice(0, 8).map((src, i) => (
                                <div key={i} className="media-preview-item">
                                    <img src={src} alt="media" />
                                </div>
                            ))}
                        </div>
                        <button className="btn-view-all" onClick={() => openRepoTab('media')}>Xem tất cả</button>
                    </>
                )}
            </div>

            {/* Mục 2: File (Preview) - HIỂN THỊ TỐI ĐA 3 FILE */}
            <div className="info-section">
                <div className="section-header" onClick={() => toggleSection('files')}>
                    <span>File đã gửi</span>
                    <ChevronDown size={18} className={`section-arrow ${!sections.files ? 'collapsed' : ''}`} />
                </div>
                {sections.files && (
                    <div className="file-preview-list">
                        {/* Dùng slice(0, 3) để chỉ lấy 3 file đầu tiên */}
                        {MOCK_PREVIEW_FILES.slice(0, 3).map((file, i) => (
                            <div key={i} className="link-item">
                                <FileIconType type={file.type} />
                                <div className="item-details">
                                    <div className="item-name">{file.name}</div>
                                    <div className="item-meta">{file.size} • {file.date}</div>
                                </div>
                            </div>
                        ))}
                        <button className="btn-view-all" onClick={() => openRepoTab('file')}>Xem tất cả</button>
                    </div>
                )}
            </div>

            {/* Mục 3: Link (Preview) - HIỂN THỊ TỐI ĐA 3 LINK */}
            <div className="info-section">
                <div className="section-header" onClick={() => toggleSection('links')}>
                    <span>Link đã gửi</span>
                    <ChevronDown size={18} className={`section-arrow ${!sections.links ? 'collapsed' : ''}`} />
                </div>
                {sections.links && (
                    <div className="file-preview-list">
                        {/* Dùng slice(0, 3) để chỉ lấy 3 link đầu tiên */}
                        {MOCK_PREVIEW_LINKS.slice(0, 3).map((link, i) => (
                            <div key={i} className="link-item">
                                <div className="file-icon link"><LinkIcon size={18}/></div>
                                <div className="item-details">
                                    <div className="item-name">{link.title}</div>
                                    <div className="item-meta" style={{color: '#0068ff'}}>{link.url}</div>
                                </div>
                            </div>
                        ))}
                        <button className="btn-view-all" onClick={() => openRepoTab('link')}>Xem tất cả</button>
                    </div>
                )}
            </div>

            {/* Mục 4: Bảo mật */}
            <div className="info-section">
                <div className="section-header" onClick={() => toggleSection('security')}>
                    <span>Thiết lập bảo mật</span>
                    <ChevronDown size={18} className={`section-arrow ${!sections.security ? 'collapsed' : ''}`} />
                </div>
                {sections.security && (
                    <div className="setting-list">
                        <div className="setting-item">
                            <Clock size={20} />
                            <span style={{ flex: 1 }}>Tin nhắn tự xóa</span>
                            <span style={{ fontSize: '13px', color: '#7589a3' }}>Tắt</span>
                        </div>
                        <div className="setting-item">
                            <EyeOff size={20} />
                            <span>Ẩn trò chuyện</span>
                        </div>
                        <div className="setting-item">
                            <AlertTriangle size={20} />
                            <span>Báo xấu</span>
                        </div>
                        <div className="setting-item delete">
                            <Trash2 size={20} />
                            <span>Xóa lịch sử trò chuyện</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    // ================== RENDER REPO MODE (Kho lưu trữ - KHÔNG GIỚI HẠN) ==================
    const renderRepoMode = () => (
        <div className="repo-container">
            {/* Header Repo */}
            <div className="panel-header">
                <div className="repo-header-left" onClick={() => setActiveTab('info')}>
                    <ChevronLeft size={24} />
                </div>
                <span>Kho lưu trữ</span>
            </div>

            {/* Tab Navigation */}
            <div className="repo-tabs">
                <div className={`repo-tab ${activeRepoTab === 'media' ? 'active' : ''}`} onClick={() => setActiveRepoTab('media')}>
                    Ảnh/Video
                </div>
                <div className={`repo-tab ${activeRepoTab === 'file' ? 'active' : ''}`} onClick={() => setActiveRepoTab('file')}>
                    File
                </div>
                <div className={`repo-tab ${activeRepoTab === 'link' ? 'active' : ''}`} onClick={() => setActiveRepoTab('link')}>
                    Link
                </div>
            </div>

            {/* Bộ lọc */}
            <div className="repo-filters-bar">
                <div className="filter-chip">
                    <span>Người gửi</span>
                    <ChevronDown size={14} />
                </div>
                <div className="filter-chip">
                    <span>Ngày gửi</span>
                    <ChevronDown size={14} />
                </div>
            </div>

            {/* Content Area */}
            <div className="panel-body repo-list-container">

                {/* --- 1. TAB ẢNH/VIDEO --- */}
                {activeRepoTab === 'media' && REPO_MEDIA_GROUPS.map((group, idx) => (
                    <div key={idx} className="repo-group">
                        <div className="date-group-label">{group.date}</div>
                        <div className="repo-media-grid">
                            {group.items.map((src, i) => (
                                <div key={i} className="media-preview-item">
                                    <img src={src} alt="repo-media" loading="lazy" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* --- 2. TAB FILE --- */}
                {activeRepoTab === 'file' && REPO_FILE_GROUPS.map((group, idx) => (
                    <div key={idx} className="repo-group">
                        <div className="date-group-label">{group.date}</div>
                        {group.items.map((file, i) => (
                            <div key={i} className="link-item" style={{marginBottom: 10}}>
                                <FileIconType type={file.type} />
                                <div className="item-details">
                                    <div className="item-name">{file.name}</div>
                                    <div className="item-meta">{file.size}</div>
                                </div>
                                <MoreHorizontal size={16} color="#7589a3" />
                            </div>
                        ))}
                    </div>
                ))}

                {/* --- 3. TAB LINK --- */}
                {activeRepoTab === 'link' && REPO_LINK_GROUPS.map((group, idx) => (
                    <div key={idx} className="repo-group">
                        <div className="date-group-label">{group.date}</div>
                        {group.items.map((link, i) => (
                            <div key={i} className="link-item" style={{marginBottom: 12}}>
                                <div className="file-icon link"><LinkIcon size={20}/></div>
                                <div className="item-details">
                                    <div className="item-name">{link.title}</div>
                                    <div className="item-meta" style={{color: '#0068ff'}}>{link.url}</div>
                                </div>
                                <MoreHorizontal size={16} color="#7589a3" />
                            </div>
                        ))}
                    </div>
                ))}

            </div>
        </div>
    );

    return (
        <aside className="info-panel-container">
            {activeTab === 'info' ? (
                <>
                    <div className="panel-header">Thông tin hội thoại</div>
                    <div className="panel-body">{renderInfoMode()}</div>
                </>
            ) : (
                renderRepoMode()
            )}
        </aside>
    );
};

// Component icon phụ trợ
const FileIconType = ({ type }) => {
    if (type === 'folder') return <div className="file-icon folder"><Folder size={18} fill="#FFC107" stroke="#FFC107"/></div>
    if (type === 'word') return <div className="file-icon word" style={{backgroundColor: '#e6f2ff', color: '#0078d4'}}>W</div>
    if (type === 'zip') return <div className="file-icon" style={{backgroundColor: '#f0f0f0'}}><FileCode size={18}/></div>
    if (type === 'excel') return <div className="file-icon excel" style={{backgroundColor: '#e6fffa', color: '#28a745'}}>X</div>
    if (type === 'pdf') return <div className="file-icon pdf" style={{backgroundColor: '#ffe6e6', color: '#dc3545'}}>PDF</div>
    return <div className="file-icon"><FileText size={18}/></div>
};