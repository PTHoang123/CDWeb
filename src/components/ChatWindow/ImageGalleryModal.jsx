import React, { useState, useMemo, useEffect } from "react";
import {
    X, Download, Share2, RotateCcw, RotateCw,
    ZoomIn, ZoomOut
} from "lucide-react";
import "./imageGallery.css";

const ImageGalleryModal = ({ isOpen, onClose, currentImage, allMessages = [] }) => {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [selectedImg, setSelectedImg] = useState(currentImage);
    const [showSidebar, setShowSidebar] = useState(true);

    // Reset khi mở modal hoặc đổi ảnh input
    useEffect(() => {
        if (currentImage) {
            setSelectedImg(currentImage);
            setZoom(1);
            setRotation(0);
        }
    }, [currentImage, isOpen]);

    // --- LOGIC XỬ LÝ DỮ LIỆU AN TOÀN ---
    const imageGroups = useMemo(() => {
        // 1. Lọc lấy ảnh
        const imagesOnly = allMessages.filter(m => m.type === "image");

        // 2. Gom nhóm
        const groups = {};

        imagesOnly.forEach(img => {
            let dateStr = "Gần đây";

            // Ưu tiên dùng trường createdAt nếu có
            if (img.createdAt) {
                const d = new Date(img.createdAt);
                if (!isNaN(d)) dateStr = d.toLocaleDateString("vi-VN");
            }
            // Nếu id là timestamp
            else if (typeof img.id === 'number' && img.id > 1_000_000_000_000) {
                const d = new Date(img.id);
                if (!isNaN(d)) dateStr = d.toLocaleDateString("vi-VN");
            }
            // Fallback
            else if (img.date) {
                dateStr = img.date;
            }

            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(img);
        });

        // Sắp xếp
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => (b.id || 0) - (a.id || 0));
        });

        return groups;
    }, [allMessages]);

    const sortedDateKeys = Object.keys(imageGroups).sort((a, b) => {
        if (a === "Gần đây") return -1;
        return 0;
    });

    if (!isOpen || !selectedImg) return null;

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
    const handleRotateRight = () => setRotation(prev => prev + 90);
    const handleRotateLeft = () => setRotation(prev => prev - 90);

    // --- SỬA LỖI DOWNLOAD TẠI ĐÂY ---
    // --- HÀM DOWNLOAD ĐÃ TỐI ƯU ---
        const downloadImage = async () => {
            if (!selectedImg || !selectedImg.content) return;

            try {
                const imageUrl = selectedImg.content;
                // Tạo tên file an toàn
                const fileName = `image_${selectedImg.id || Date.now()}.jpg`;

                // TRƯỜNG HỢP 1: Ảnh là Base64 (Data URL)
                if (imageUrl.startsWith("data:")) {
                    const link = document.createElement("a");
                    link.href = imageUrl;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    return;
                }

                // TRƯỜNG HỢP 2: Ảnh URL (Cố gắng tải về Blob để ép trình duyệt download)
                // Lưu ý: Đã bỏ 'headers' để tránh lỗi CORS Preflight không cần thiết
                const response = await fetch(imageUrl, {
                    method: 'GET',
                    mode: 'cors',
                });

                if (!response.ok) throw new Error("Network response was not ok");

                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();

                // Dọn dẹp
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);

            } catch (error) {
                console.error("Lỗi download blob, chuyển sang phương án dự phòng:", error);

                // TRƯỜNG HỢP 3 (FALLBACK): Nếu CORS chặn không cho tải Blob
                // Tạo thẻ a và click trực tiếp (hy vọng trình duyệt xử lý)
                const link = document.createElement("a");
                link.href = selectedImg.content;
                link.download = `image_${Date.now()}`;
                link.target = "_blank"; // Vẫn cần blank để nếu không tải được thì nó mở tab mới thay vì load lại trang
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        };

    return (
        <div className="gallery-overlay">
            {/* Header */}
            <div className="gallery-header">
                <span className="gallery-title">Ảnh hội thoại ({allMessages.filter(m => m.type === 'image').length})</span>
                <button className="close-btn" onClick={onClose}><X size={24} /></button>
            </div>

            <div className="gallery-main-content">
                {/* View ảnh chính */}
                <div className="image-viewer-container">
                    <div className="image-wrapper" style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transition: "transform 0.3s ease"
                    }}>
                        <img src={selectedImg.content} alt="Preview" />
                    </div>

                    <div className="gallery-footer-bar">
                        <div className="footer-left">
                            <span className="time-stamp">
                                {selectedImg.time || ""} {selectedImg.date || ""}
                            </span>
                        </div>
                        <div className="footer-center">
                            <button title="Chia sẻ"><Share2 size={20} /></button>
                            {/* Gọi hàm download mới */}
                            <button title="Tải về" onClick={(e) => {
                                e.stopPropagation(); // Ngăn sự kiện lan ra ngoài nếu cần
                                downloadImage();
                            }}>
                                <Download size={20} />
                            </button>
                            <div className="divider"></div>
                            <button onClick={handleRotateLeft}><RotateCcw size={20} /></button>
                            <button onClick={handleRotateRight}><RotateCw size={20} /></button>
                            <button onClick={handleZoomIn}><ZoomIn size={20} /></button>
                            <button onClick={handleZoomOut}><ZoomOut size={20} /></button>
                        </div>
                    </div>
                </div>

                {/* Sidebar danh sách ảnh */}
                <div className="image-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="sidebar-scroll">
                        {sortedDateKeys.length === 0 ? (
                            <div style={{padding: 20, textAlign: 'center', color: '#888'}}>
                                Không có ảnh nào khác
                            </div>
                        ) : (
                            sortedDateKeys.map(date => (
                                <div key={date} className="date-group">
                                    <div className="date-label">{date}</div>
                                    <div className="thumbnail-grid">
                                        {imageGroups[date].map(img => (
                                            <div
                                                key={img.id}
                                                className={`thumb-item ${selectedImg.id === img.id ? 'active' : ''}`}
                                                onClick={() => {
                                                    setSelectedImg(img);
                                                    setZoom(1);
                                                    setRotation(0);
                                                }}
                                            >
                                                <img src={img.content} alt="thumb" loading="lazy" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageGalleryModal;