import React, { useState, useMemo } from 'react';
import {
    Bell, Pin, Users, Edit2, ChevronDown, ChevronLeft,
    Search, Folder, FileText, FileCode, Link as LinkIcon,
    MoreHorizontal, Clock, EyeOff, AlertTriangle, Trash2,
    Image as ImageIcon
} from 'lucide-react';
import './InfoChatAndRepo.css';

// Import Modal Gallery (Đảm bảo đường dẫn này đúng với thư mục của bạn)
import ImageGalleryModal from '../ChatWindow/ImageGalleryModal';

export default function InfoChatAndRepo({ activeChat, allMessages = [] }) {
    const [activeTab, setActiveTab] = useState('info');
    const [activeRepoTab, setActiveRepoTab] = useState('media');
    const [sections, setSections] = useState({
        media: true, files: true, links: true, security: true
    });

    // State cho Modal Gallery
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [currentGalleryImg, setCurrentGalleryImg] = useState(null);

    // --- 1. XỬ LÝ ẢNH (MEDIA) ---
    const mediaList = useMemo(() => {
        if (!Array.isArray(allMessages)) return [];
        return allMessages
            .filter(m => m && m.type === 'image')
            .map(m => ({
                id: m.id || Math.random(),
                src: m.content,
                content: m.content,
                time: m.time || "",
                createdAt: m.createdAt,
                dateObj: new Date(m.id || Date.now()) // Dùng ID làm timestamp nếu không có createdAt
            }))
            .reverse();
    }, [allMessages]);

    // --- 2. XỬ LÝ FILE (FIX LỖI KHÔNG TẢI ĐƯỢC) ---
    const fileList = useMemo(() => {
        if (!Array.isArray(allMessages)) return [];
        return allMessages
            .filter(m => m && m.type === 'file')
            .map(m => {
                let fileName = "File không tên";
                let fileSize = "Unknown";
                let fileUrl = null;

                let rawContent = m.content;

                try {
                    // Trường hợp 1: Content là chuỗi JSON (Lịch sử chat trả về)
                    if (typeof rawContent === 'string') {
                        if (rawContent.trim().startsWith('{')) {
                            const parsed = JSON.parse(rawContent);
                            fileName = parsed.name || fileName;
                            fileSize = parsed.size || fileSize;
                            // QUAN TRỌNG: ChatWindow lưu base64 trong trường 'data'
                            fileUrl = parsed.data || parsed.url || parsed.fileUrl || null;
                        }
                    }
                    // Trường hợp 2: Content đã là Object (Vừa gửi xong)
                    else if (typeof rawContent === 'object' && rawContent !== null) {
                        fileName = rawContent.name || fileName;
                        fileSize = rawContent.size || fileSize;
                        // QUAN TRỌNG: Lấy trường 'data'
                        fileUrl = rawContent.data || rawContent.url || null;
                    }
                } catch (e) {
                    console.error("Lỗi parse file info:", e);
                }

                return {
                    id: m.id || Math.random(),
                    name: fileName,
                    size: fileSize,
                    url: fileUrl, // Đây là chuỗi Base64 để tải
                    type: checkFileType(fileName),
                    dateObj: new Date(m.id || Date.now())
                };
            })
            .reverse();
    }, [allMessages]);

    // --- 3. XỬ LÝ LINK ---
    const linkList = useMemo(() => {
        if (!Array.isArray(allMessages)) return [];
        return allMessages
            .filter(m => m && m.type === 'text' && typeof m.content === 'string')
            .reduce((acc, m) => {
                const urls = m.content.match(/(https?:\/\/[^\s]+)/g);
                if (urls) {
                    urls.forEach(url => {
                        acc.push({
                            id: m.id || Math.random(),
                            title: url,
                            url: url,
                            dateObj: new Date(m.id || Date.now())
                        });
                    });
                }
                return acc;
            }, [])
            .reverse();
    }, [allMessages]);

    // Helper Gom nhóm
    const groupItemsByDate = (items) => {
        const groups = {};
        items.forEach(item => {
            const d = item.dateObj;
            const dateStr = !isNaN(d) ? d.toLocaleDateString("vi-VN") : "Gần đây";
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(item);
        });
        return Object.keys(groups).map(date => ({
            date,
            items: groups[date]
        }));
    };

    const repoMediaGroups = useMemo(() => groupItemsByDate(mediaList), [mediaList]);
    const repoFileGroups = useMemo(() => groupItemsByDate(fileList), [fileList]);
    const repoLinkGroups = useMemo(() => groupItemsByDate(linkList), [linkList]);

    // --- HANDLERS ---

    const handleImageClick = (imgItem) => {
        setCurrentGalleryImg(imgItem);
        setIsGalleryOpen(true);
    };

    // --- HÀM DOWNLOAD FILE ---
    const handleDownloadFile = (e, fileItem) => {
        e.stopPropagation();

        if (!fileItem.url) {
            console.log("File Item Error:", fileItem);
            alert(`File này chưa được tải xong hoặc bị lỗi nội dung. (Tên: ${fileItem.name})`);
            return;
        }

        const link = document.createElement("a");
        link.href = fileItem.url; // fileItem.url chứa Base64 data
        link.download = fileItem.name;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpenLink = (url) => {
        if (url) window.open(url, "_blank", "noopener,noreferrer");
    };

    const toggleSection = (key) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isRoom = activeChat?.type === 'room';
    const displayName = activeChat?.name || "Cuộc trò chuyện";
    const displayAvatar = isRoom
        ? "https://cdn-icons-png.flaticon.com/512/166/166258.png"
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;

    // ================== RENDER INFO MODE ==================
    const renderInfoMode = () => (
        <>
            <div className="info-profile">
                <img src={displayAvatar} alt="avatar" className="info-avatar-large" />
                <div className="info-name-row">
                    <span>{displayName}</span>
                    <Edit2 size={16} color="#7589a3" style={{ cursor: 'pointer' }} />
                </div>
                <div className="info-actions">
                    <div className="action-item"><div className="action-icon-circle"><Bell size={20} /></div><span>Tắt thông báo</span></div>
                    <div className="action-item"><div className="action-icon-circle"><Pin size={20} /></div><span>Ghim hội thoại</span></div>
                    <div className="action-item"><div className="action-icon-circle"><Users size={20} /></div><span>Tạo nhóm</span></div>
                    <div className="action-item"><div className="action-icon-circle"><Search size={20} /></div><span>Tìm tin nhắn</span></div>
                </div>
            </div>

            {/* Media */}
            <div className="info-section">
                <div className="section-header" onClick={() => toggleSection('media')}>
                    <span>Ảnh / Video ({mediaList.length})</span>
                    <ChevronDown size={18} className={`section-arrow ${!sections.media ? 'collapsed' : ''}`} />
                </div>
                {sections.media && (
                    <>
                        <div className="media-preview-grid">
                            {mediaList.length === 0 ? <p className="empty-text">Chưa có ảnh</p> :
                                mediaList.slice(0, 8).map((item, i) => (
                                    <div key={i} className="media-preview-item" onClick={() => handleImageClick(item)}>
                                        <img src={item.src} alt="media" />
                                    </div>
                                ))}
                        </div>
                        {mediaList.length > 0 && <button className="btn-view-all" onClick={() => { setActiveRepoTab('media'); setActiveTab('repo'); }}>Xem tất cả</button>}
                    </>
                )}
            </div>

            {/* Files */}
            <div className="info-section">
                <div className="section-header" onClick={() => toggleSection('files')}>
                    <span>File đã gửi ({fileList.length})</span>
                    <ChevronDown size={18} className={`section-arrow ${!sections.files ? 'collapsed' : ''}`} />
                </div>
                {sections.files && (
                    <div className="file-preview-list">
                        {fileList.length === 0 ? <p className="empty-text">Chưa có file</p> :
                            fileList.slice(0, 3).map((file, i) => (
                                <div
                                    key={i}
                                    className="link-item hover-effect"
                                    onClick={(e) => handleDownloadFile(e, file)}
                                    title="Nhấn để tải xuống"
                                    style={{cursor: 'pointer'}}
                                >
                                    <FileIconType type={file.type} />
                                    <div className="item-details">
                                        <div className="item-name">{file.name}</div>
                                        <div className="item-meta">{file.size}</div>
                                    </div>
                                </div>
                            ))}
                        {fileList.length > 0 && <button className="btn-view-all" onClick={() => { setActiveRepoTab('file'); setActiveTab('repo'); }}>Xem tất cả</button>}
                    </div>
                )}
            </div>

            {/* Links */}
            <div className="info-section">
                <div className="section-header" onClick={() => toggleSection('links')}>
                    <span>Link đã gửi ({linkList.length})</span>
                    <ChevronDown size={18} className={`section-arrow ${!sections.links ? 'collapsed' : ''}`} />
                </div>
                {sections.links && (
                    <div className="file-preview-list">
                        {linkList.length === 0 ? <p className="empty-text">Chưa có link</p> :
                            linkList.slice(0, 3).map((link, i) => (
                                <div key={i} className="link-item hover-effect" onClick={() => handleOpenLink(link.url)}>
                                    <div className="file-icon link"><LinkIcon size={18}/></div>
                                    <div className="item-details">
                                        <div className="item-name">{link.title}</div>
                                        <div className="item-meta" style={{color: '#0068ff'}}>{link.url}</div>
                                    </div>
                                </div>
                            ))}
                        {linkList.length > 0 && <button className="btn-view-all" onClick={() => { setActiveRepoTab('link'); setActiveTab('repo'); }}>Xem tất cả</button>}
                    </div>
                )}
            </div>

            {/* Security */}
            <div className="info-section">
                <div className="section-header" onClick={() => toggleSection('security')}>
                    <span>Thiết lập bảo mật</span>
                    <ChevronDown size={18} className={`section-arrow ${!sections.security ? 'collapsed' : ''}`} />
                </div>
                {sections.security && (
                    <div className="setting-list">
                        <div className="setting-item"><Clock size={20} /><span>Tin nhắn tự xóa</span></div>
                        <div className="setting-item"><EyeOff size={20} /><span>Ẩn trò chuyện</span></div>
                        <div className="setting-item"><AlertTriangle size={20} /><span>Báo xấu</span></div>
                        <div className="setting-item delete"><Trash2 size={20} /><span>Xóa lịch sử</span></div>
                    </div>
                )}
            </div>
        </>
    );

    // ================== RENDER REPO MODE ==================
    const renderRepoMode = () => (
        <div className="repo-container">
            <div className="panel-header">
                <div className="repo-header-left" onClick={() => setActiveTab('info')}>
                    <ChevronLeft size={24} />
                </div>
                <span>Kho lưu trữ</span>
            </div>
            <div className="repo-tabs">
                <div className={`repo-tab ${activeRepoTab === 'media' ? 'active' : ''}`} onClick={() => setActiveRepoTab('media')}>Ảnh/Video</div>
                <div className={`repo-tab ${activeRepoTab === 'file' ? 'active' : ''}`} onClick={() => setActiveRepoTab('file')}>File</div>
                <div className={`repo-tab ${activeRepoTab === 'link' ? 'active' : ''}`} onClick={() => setActiveRepoTab('link')}>Link</div>
            </div>

            <div className="panel-body repo-list-container">
                {activeRepoTab === 'media' && repoMediaGroups.map((group, idx) => (
                    <div key={idx} className="repo-group">
                        <div className="date-group-label">{group.date}</div>
                        <div className="repo-media-grid">
                            {group.items.map((item, i) => (
                                <div key={i} className="media-preview-item" onClick={() => handleImageClick(item)}>
                                    <img src={item.src} alt="media" loading="lazy" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {activeRepoTab === 'file' && repoFileGroups.map((group, idx) => (
                    <div key={idx} className="repo-group">
                        <div className="date-group-label">{group.date}</div>
                        {group.items.map((file, i) => (
                            <div
                                key={i}
                                className="link-item hover-effect"
                                onClick={(e) => handleDownloadFile(e, file)}
                                style={{cursor: 'pointer'}}
                                title="Nhấn để tải"
                            >
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

                {activeRepoTab === 'link' && repoLinkGroups.map((group, idx) => (
                    <div key={idx} className="repo-group">
                        <div className="date-group-label">{group.date}</div>
                        {group.items.map((link, i) => (
                            <div key={i} className="link-item hover-effect" onClick={() => handleOpenLink(link.url)}>
                                <div className="file-icon link"><LinkIcon size={20}/></div>
                                <div className="item-details">
                                    <div className="item-name">{link.title}</div>
                                    <div className="item-meta link-color">{link.url}</div>
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

            {isGalleryOpen && (
                <ImageGalleryModal
                    isOpen={isGalleryOpen}
                    onClose={() => setIsGalleryOpen(false)}
                    currentImage={currentGalleryImg}
                    allMessages={allMessages || []}
                />
            )}
        </aside>
    );
}

// Helpers
const checkFileType = (fileName) => {
    if (!fileName) return 'file';
    const ext = fileName.split('.').pop().toLowerCase();
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['zip', 'rar'].includes(ext)) return 'zip';
    return 'file';s
};

const FileIconType = ({ type }) => {
    if (type === 'folder') return <div className="file-icon folder"><Folder size={18} fill="#FFC107" stroke="#FFC107"/></div>;
    if (type === 'word') return <div className="file-icon word" style={{backgroundColor: '#e6f2ff', color: '#0078d4'}}>W</div>;
    if (type === 'zip') return <div className="file-icon" style={{backgroundColor: '#f0f0f0'}}><FileCode size={18}/></div>;
    if (type === 'excel') return <div className="file-icon excel" style={{backgroundColor: '#e6fffa', color: '#28a745'}}>X</div>;
    if (type === 'pdf') return <div className="file-icon pdf" style={{backgroundColor: '#ffe6e6', color: '#dc3545'}}>PDF</div>;
    return <div className="file-icon"><FileText size={18}/></div>;
};