import React, { useState } from 'react';
import {
    Bell, Pin, Users, Edit2, ChevronDown, ChevronLeft,
    Search, Folder, FileText, FileCode, Link as LinkIcon,
    MoreHorizontal, Clock, EyeOff, AlertTriangle, Trash2
} from 'lucide-react';
import './InfoChatAndRepo.css';

// --- MOCK DATA GIỐNG ẢNH ---
const MOCK_IMAGES = [
    "https://via.placeholder.com/150/007bff/fff?text=IMG1",
    "https://via.placeholder.com/150/28a745/fff?text=IMG2",
    "https://via.placeholder.com/150/dc3545/fff?text=IMG3",
    "https://via.placeholder.com/150/ffc107/fff?text=Map",
    "https://via.placeholder.com/150/6610f2/fff?text=Bill",
    "https://via.placeholder.com/150/20c997/fff?text=Code",
    "https://via.placeholder.com/150/17a2b8/fff?text=Chat",
];

const MOCK_FILES = [
    { name: "Snake game", size: "10.01 KB", date: "15/10/2025", type: "folder" },
    { name: "A.docx", size: "212.9 KB", date: "21/08/2025", type: "word" },
    { name: "TeapotRotate.java", size: "3.46 KB", date: "13/08/2025", type: "code" },
    { name: "MovingWireSphere.java", size: "5.62 KB", date: "13/08/2025", type: "code" },
    { name: "RobotCubes.java", size: "8.52 KB", date: "13/08/2025", type: "code" },
];

const MOCK_LINKS = [
    { title: "ThucHanh05 - Google Drive", url: "drive.google.com", date: "30/10" },
    { title: "GitHub - mrfrozen97/Java-3D...", url: "github.com", date: "15/07" },
    { title: "Java 3D game using LWJGL...", url: "www.youtube.com", date: "15/07" },
];

const InfoChatAndRepo = () => {
    // State quản lý View hiện tại: 'INFO' hoặc 'REPO'
    const [viewMode, setViewMode] = useState('INFO');

    // State quản lý Tab trong kho lưu trữ: 'MEDIA', 'FILES', 'LINKS'
    const [repoTab, setRepoTab] = useState('MEDIA');

    // Hàm chuyển sang Kho lưu trữ với tab cụ thể
    const openRepo = (tab) => {
        setRepoTab(tab);
        setViewMode('REPO');
    };

    // Hàm quay lại Info
    const backToInfo = () => {
        setViewMode('INFO');
    };

    return (
        <div className="info-panel-container">
            {viewMode === 'INFO' ? (
                <InfoContent onOpenRepo={openRepo} />
            ) : (
                <RepoContent
                    activeTab={repoTab}
                    setActiveTab={setRepoTab}
                    onBack={backToInfo}
                />
            )}
        </div>
    );
};

// ================= COMPONENT CON: THÔNG TIN HỘI THOẠI =================
const InfoContent = ({ onOpenRepo }) => {
    return (
        <>
            <div className="panel-header">Thông tin hội thoại</div>

            <div className="panel-body">
                {/* Profile Header */}
                <div className="info-profile">
                    <img className="info-avatar-large" src="https://via.placeholder.com/100" alt="avatar" />
                    <div className="info-name-row">
                        <span>Công Danh</span>
                        <Edit2 size={16} style={{cursor: 'pointer'}}/>
                    </div>

                    {/* Action Buttons */}
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
                    </div>
                </div>

                <div className="info-section">
                    <div className="section-header" style={{fontWeight: 400}}>
                        <div style={{display:'flex', gap: 10, alignItems:'center'}}>
                            <Clock size={20} /> Danh sách nhắc hẹn
                        </div>
                    </div>
                </div>

                <div className="info-section" style={{borderTop: 'none'}}>
                    <div className="section-header" style={{fontWeight: 400}}>
                        <div style={{display:'flex', gap: 10, alignItems:'center'}}>
                            <Users size={20} /> 5 nhóm chung
                        </div>
                    </div>
                </div>

                {/* Section Ảnh/Video */}
                <div className="info-section">
                    <div className="section-header" onClick={() => onOpenRepo('MEDIA')}>
                        <span>Ảnh/Video</span>
                        <ChevronDown size={16} />
                    </div>
                    <div className="media-preview-grid">
                        {MOCK_IMAGES.slice(0, 8).map((src, i) => (
                            <div key={i} className="media-preview-item">
                                <img src={src} alt="" />
                            </div>
                        ))}
                    </div>
                    <button className="btn-view-all" onClick={() => onOpenRepo('MEDIA')}>Xem tất cả</button>
                </div>

                {/* Section File */}
                <div className="info-section">
                    <div className="section-header" onClick={() => onOpenRepo('FILES')}>
                        <span>File</span>
                        <ChevronDown size={16} />
                    </div>
                    <div className="file-preview-list">
                        {MOCK_FILES.slice(0, 3).map((file, i) => (
                            <div key={i} className="file-item">
                                <FileIconType type={file.type} />
                                <div className="item-details">
                                    <div className="item-name">{file.name}</div>
                                    <div className="item-meta">{file.size} • {file.date}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="btn-view-all" onClick={() => onOpenRepo('FILES')}>Xem tất cả</button>
                </div>

                {/* Section Link */}
                <div className="info-section">
                    <div className="section-header" onClick={() => onOpenRepo('LINKS')}>
                        <span>Link</span>
                        <ChevronDown size={16} />
                    </div>
                    <div className="file-preview-list">
                        {MOCK_LINKS.map((link, i) => (
                            <div key={i} className="link-item">
                                <div className="file-icon link"><LinkIcon size={20}/></div>
                                <div className="item-details">
                                    <div className="item-name">{link.title}</div>
                                    <div className="item-meta" style={{color: '#0078d4'}}>{link.url}</div>
                                </div>
                                <div style={{fontSize: 12, color: '#888'}}>{link.date}</div>
                            </div>
                        ))}
                    </div>
                    <button className="btn-view-all" onClick={() => onOpenRepo('LINKS')}>Xem tất cả</button>
                </div>

                {/* Thiết lập bảo mật */}
                {/* --- THIẾT LẬP BẢO MẬT (Đã bổ sung Tin nhắn tự xóa) --- */}
                <div className="info-section">
                    <div className="section-header">Thiết lập bảo mật</div>
                    <div className="setting-list">
                        {/* Bổ sung mục Tin nhắn tự xóa */}
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
                </div>
            </div>
        </>
    );
};

// ================= COMPONENT CON: KHO LƯU TRỮ (REPO) =================
const RepoContent = ({ activeTab, setActiveTab, onBack }) => {
    return (
        <>
            <div className="panel-header">
                <div className="repo-header-left" onClick={onBack}>
                    <ChevronLeft size={24} />
                </div>
                Kho lưu trữ
                <div className="repo-header-right">Chọn</div>
            </div>

            {/* Tabs */}
            <div className="repo-tabs">
                <div
                    className={`repo-tab ${activeTab === 'MEDIA' ? 'active' : ''}`}
                    onClick={() => setActiveTab('MEDIA')}
                >
                    Ảnh/Video
                </div>
                <div
                    className={`repo-tab ${activeTab === 'FILES' ? 'active' : ''}`}
                    onClick={() => setActiveTab('FILES')}
                >
                    Files
                </div>
                <div
                    className={`repo-tab ${activeTab === 'LINKS' ? 'active' : ''}`}
                    onClick={() => setActiveTab('LINKS')}
                >
                    Links
                </div>
            </div>

            {/* Filters */}
            <div className="repo-filters">
                <div className="search-box">
                    <Search size={16} color="#aaa" />
                    <input type="text" placeholder={`Tìm kiếm ${activeTab.toLowerCase()}...`} />
                </div>
                <div className="filter-tags">
                    {activeTab === 'FILES' && (
                        <div className="filter-tag">Loại <ChevronDown size={12}/></div>
                    )}
                    <div className="filter-tag">Người gửi <ChevronDown size={12}/></div>
                    <div className="filter-tag">Ngày gửi <ChevronDown size={12}/></div>
                </div>
            </div>

            <div className="panel-body repo-list-container">
                {/* NỘI DUNG THAY ĐỔI THEO TAB */}

                {activeTab === 'MEDIA' && (
                    <>
                        <div className="date-group-label">Ngày 30 Tháng 12</div>
                        <div className="repo-media-grid">
                            {MOCK_IMAGES.slice(0,3).map((img,i) => (
                                <div key={i} className="media-preview-item"><img src={img} alt=""/></div>
                            ))}
                        </div>
                        <div className="date-group-label">Ngày 29 Tháng 12</div>
                        <div className="repo-media-grid">
                            {MOCK_IMAGES.slice(3,6).map((img,i) => (
                                <div key={i} className="media-preview-item"><img src={img} alt=""/></div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'FILES' && (
                    <>
                        <div className="date-group-label">Ngày 15 Tháng 10</div>
                        <div className="file-item">
                            <FileIconType type="folder" />
                            <div className="item-details">
                                <div className="item-name">Snake game</div>
                                <div className="item-meta">10.01 KB • File không tồn tại</div>
                            </div>
                        </div>

                        <div className="date-group-label">Ngày 21 Tháng 8</div>
                        <div className="file-item">
                            <FileIconType type="word" />
                            <div className="item-details">
                                <div className="item-name">A.docx</div>
                                <div className="item-meta">212.9 KB • File không tồn tại</div>
                            </div>
                        </div>

                        <div className="date-group-label">Ngày 13 Tháng 8</div>
                        {MOCK_FILES.filter(f => f.type === 'code').map((file, i) => (
                            <div key={i} className="file-item" style={{marginBottom: 10}}>
                                <FileIconType type="code" />
                                <div className="item-details">
                                    <div className="item-name">{file.name}</div>
                                    <div className="item-meta">{file.size} • File không tồn tại</div>
                                </div>
                                <MoreHorizontal size={16} color="#aaa" />
                            </div>
                        ))}
                    </>
                )}

                {activeTab === 'LINKS' && (
                    <>
                        <div className="date-group-label">Ngày 30 Tháng 10</div>
                        <div className="link-item">
                            <div className="file-icon link"><LinkIcon size={20}/></div>
                            <div className="item-details">
                                <div className="item-name">ThucHanh05 - Google Drive</div>
                                <div className="item-meta" style={{color: '#0078d4'}}>drive.google.com</div>
                            </div>
                        </div>

                        <div className="date-group-label">Ngày 15 Tháng 7</div>
                        {MOCK_LINKS.slice(1).map((link, i) => (
                            <div key={i} className="link-item" style={{marginBottom: 10}}>
                                <div className="file-icon link"><LinkIcon size={20}/></div>
                                <div className="item-details">
                                    <div className="item-name">{link.title}</div>
                                    <div className="item-meta" style={{color: '#0078d4'}}>{link.url}</div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </>
    );
};

// Helper để render icon file theo loại
const FileIconType = ({ type }) => {
    if (type === 'folder') {
        return <div className="file-icon folder"><Folder size={20} fill="#5a4a15"/></div>
    }
    if (type === 'word') {
        return <div className="file-icon word">W</div>
    }
    if (type === 'code') {
        return <div className="file-icon code">JAV</div>
    }
    return <div className="file-icon"><FileText size={20}/></div>
};

export default InfoChatAndRepo;