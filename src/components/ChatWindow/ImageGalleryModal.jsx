import React, { useState, useMemo, useEffect } from "react";
import {
    X, Download, Share2, RotateCcw, RotateCw,
    ZoomIn, ZoomOut, ChevronUp, ChevronDown, Calendar
} from "lucide-react";
import "./imageGallery.css";

const ImageGalleryModal = ({ isOpen, onClose, currentImage, allMessages }) => {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [selectedImg, setSelectedImg] = useState(currentImage);

    useEffect(() => {
        if (currentImage) {
            setSelectedImg(currentImage);
            setZoom(1); // Reset zoom về 1 khi đổi ảnh
            setRotation(0); // Reset xoay về 0 khi đổi ảnh
        }
    }, [currentImage, isOpen]);


    // Lọc ra tất cả các tin nhắn là ảnh và nhóm theo ngày
    const imageGroups = useMemo(() => {
        const imagesOnly = allMessages.filter(m => m.type === "image");
        const groups = {};

        imagesOnly.forEach(img => {
            // Giả sử m.date là "30/12/2025" hoặc lấy từ m.time
            const dateKey = img.date || "Gần đây";
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(img);
        });
        return groups;
    }, [allMessages]);

    if (!isOpen || !selectedImg) return null;

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
    const handleRotateRight = () => setRotation(prev => prev + 90);
    const handleRotateLeft = () => setRotation(prev => prev - 90);

    const downloadImage = () => {
        const link = document.createElement("a");
        link.href = selectedImg.content;
        link.download = `image_${selectedImg.id}.png`;
        link.click();
    };

    return (
        <div className="gallery-overlay">
            {/* Header: Tên người gửi hoặc tiêu đề */}
            <div className="gallery-header">
                <span className="gallery-title">Ảnh từ cuộc trò chuyện</span>
                <button className="close-btn" onClick={onClose}><X size={24} /></button>
            </div>

            <div className="gallery-main-content">
                {/* Khu vực xem ảnh chính */}
                <div className="image-viewer-container">
                    <div className="image-wrapper" style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transition: "transform 0.3s ease"
                    }}>
                        <img src={selectedImg.content} alt="Preview" />
                    </div>

                    {/* Thanh công cụ dưới ảnh */}
                    <div className="gallery-footer-bar">
                        <div className="footer-left">
                            <span className="time-stamp">{selectedImg.time} {selectedImg.date}</span>
                        </div>
                        <div className="footer-center">
                            <button title="Chia sẻ"><Share2 size={20} /></button>
                            <button title="Tải về" onClick={downloadImage}><Download size={20} /></button>
                            <div className="divider"></div>
                            <button title="Xoay trái" onClick={handleRotateLeft}><RotateCcw size={20} /></button>
                            <button title="Xoay phải" onClick={handleRotateRight}><RotateCw size={20} /></button>
                            <button title="Phóng to" onClick={handleZoomIn}><ZoomIn size={20} /></button>
                            <button title="Thu nhỏ" onClick={handleZoomOut}><ZoomOut size={20} /></button>
                        </div>
                    </div>
                </div>

                {/* Cột bên phải: Danh sách ảnh theo thời gian */}
                <div className="image-sidebar">
                    <div className="sidebar-header">Ảnh đã gửi</div>
                    <div className="sidebar-scroll">
                        {Object.keys(imageGroups).map(date => (
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
                                            <img src={img.content} alt="thumb" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="sidebar-nav">
                        <ChevronUp size={24} />
                        <ChevronDown size={24} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageGalleryModal;