import React from 'react';
import {X} from 'lucide-react'
import './modal.css'
const Modal = ({isOpen, onClose, title, children}) => {
    if (!isOpen) return null;
    return (
        <div className={"modal-overlay"} onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="title">{title}</div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20}/>
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
};

export default Modal;