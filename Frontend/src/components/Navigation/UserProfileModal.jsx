import React, { useState } from 'react';
import { X, Camera, ChevronLeft, Pencil } from 'lucide-react';
import './userprofile.css';

const UserProfileModal = ({ onClose, user}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [info, setInfo] = useState({
        name: "Đức Hải",
        gender: "Nam",
        dob: { d: "31", m: "12", y: "2004" },
        phone: "+84 867 744 571"
    });
    const userAvatar = user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || "User"}&background=random`;
    const userName = user?.displayName || user?.username || "User";
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    {isEditing ? (
                        <div className="header-left" onClick={() => setIsEditing(false)}>
                            <ChevronLeft size={20} />
                            <span>Cập nhật thông tin cá nhân</span>
                        </div>
                    ) : <span>Thông tin tài khoản</span>}
                    <X className="close-icon" onClick={onClose} size={20} />
                </div>

                <div className="modal-content-scroll">
                    {!isEditing ? (
                        <div className="profile-view">
                            {/* Ảnh bìa & Avt lấn lên nhau theo mẫu */}
                            <div className="banner-section">
                                <div className="cover-placeholder">
                                    {/* Bạn có thể thêm thẻ <img src="..." /> vào đây */}
                                </div>
                                <div className="avatar-overlap">
                                    <div className="avatar-wrapper">
                                        <img src={userAvatar} alt="avt" />
                                        <div className="camera-badge"><Camera size={14} /></div>
                                    </div>
                                    <div className="name-display">
                                        <h3>{userName}</h3>
                                        <Pencil size={14} className="edit-icon" onClick={() => setIsEditing(true)} />
                                    </div>
                                </div>
                            </div>

                            <div className="info-body">
                                <p className="title-group">Thông tin cá nhân</p>
                                <div className="info-row">
                                    <span className="label">Giới tính</span>
                                    <span className="value">{info.gender}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Ngày sinh</span>
                                    <span className="value">{`${info.dob.d} tháng ${info.dob.m}, ${info.dob.y}`}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Điện thoại</span>
                                    <span className="value">{info.phone}</span>
                                </div>
                                <p className="note-text">Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem được số này</p>
                            </div>

                            <div className="footer-action">
                                <button className="btn-update-main" onClick={() => setIsEditing(true)}>
                                    <Pencil size={16} /> Cập nhật
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Giao diện Chỉnh sửa giống Ảnh 4 */
                        <div className="profile-edit">
                            <div className="edit-group">
                                <label>Tên hiển thị</label>
                                <input type="text" value={info.name} onChange={e => setInfo({...info, name: e.target.value})} />
                            </div>
                            <div className="edit-group">
                                <p className="label-text">Thông tin cá nhân</p>
                                <div className="radio-flex">
                                    <label><input type="radio" checked={info.gender === "Nam"} onChange={() => setInfo({...info, gender: "Nam"})} /> Nam</label>
                                    <label><input type="radio" checked={info.gender === "Nữ"} onChange={() => setInfo({...info, gender: "Nữ"})} /> Nữ</label>
                                </div>
                            </div>
                            <div className="edit-group">
                                <label>Ngày sinh</label>
                                <div className="dob-grid">
                                    <select value={info.dob.d} onChange={e => setInfo({...info, dob: {...info.dob, d: e.target.value}})}>
                                        {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                                    </select>
                                    <select value={info.dob.m} onChange={e => setInfo({...info, dob: {...info.dob, m: e.target.value}})}>
                                        {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                                    </select>
                                    <select value={info.dob.y} onChange={e => setInfo({...info, dob: {...info.dob, y: e.target.value}})}>
                                        {[...Array(50)].map((_, i) => <option key={i} value={2024-i}>{2024-i}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="edit-footer-btns">
                                <button className="btn-huy" onClick={() => setIsEditing(false)}>Hủy</button>
                                <button className="btn-capnhat" onClick={() => setIsEditing(false)}>Cập nhật</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;