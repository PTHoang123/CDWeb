import React from "react";
import {MessageSquare, Contact, CheckSquare, Cloud, Settings, Monitor} from 'lucide-react';
import './sidebar.css'

const Sidebar = () => {
    return (<div className="sidebar-nav">
            {/* Ảnh đại diện */}
            <div className="user-profile-avatar">
                <img
                    src="https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/482752udT/anh-mo-ta.png"
                    alt="profile"/>
            </div>

            {/* Thanh chức năng */}
            <div className="nav-menu-items">
                <div className="nav-item active">
                    <MessageSquare size={26}/>
                </div>
                <div className="nav-item">
                    <Contact size={26}/>
                </div>

            </div>

            <div className="nav-group-bottom">
                <div className="nav-item">
                    <CheckSquare size={26}/>
                </div>
                <div className="nav-item">
                    <Cloud size={24}/>
                </div>
                <div className="nav-item">
                    <Monitor size={24}/>
                </div>
                <div className="nav-item">
                    <Settings size={24}/>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
