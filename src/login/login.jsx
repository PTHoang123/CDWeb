// src/components/Login.jsx
import React, { useState } from 'react';
import '../login/loginStyle.css';

const Login = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [credentials, setCredentials] = useState({ email: '', password: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCredentials({ ...credentials, [name]: value });
    };

    const handleLogin = (e) => {
        e.preventDefault();
        // Giả lập logic đăng nhập
        if (credentials.email && credentials.password) {
            setIsLoggedIn(true);
            console.log("Đã đăng nhập với:", credentials.email);
        } else {
            alert("Vui lòng nhập đầy đủ thông tin!");
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setCredentials({ email: '', password: '' });
    };

    if (isLoggedIn) {
        return (
            <div className="logout-section">
                <h1>Chào mừng bạn đến với Chat App!</h1>
                <button className="btn-login" onClick={handleLogout} style={{width: '200px'}}>
                    Đăng xuất
                </button>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Chat App Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Nhập email của bạn"
                            value={credentials.email}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Nhập mật khẩu"
                            value={credentials.password}
                            onChange={handleInputChange}
                        />
                    </div>
                    <button type="submit" className="btn-login">Đăng nhập</button>
                </form>
            </div>
        </div>
    );
};

export default Login;