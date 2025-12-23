import React from 'react';
import './loginStyle.css';

const Login = () => {
    const handleLogin = (e) => {
        e.preventDefault();
        // Xử lý logic đăng nhập ở đây
        console.log("Đang đăng nhập...");
    };

    return (
        <div className="login-body-wrapper">
            <div className="login-container">
                <div className="app-title">Chatify</div>
                <div className="subtitle">Đăng nhập để bắt đầu trò chuyện</div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email hoặc Username</label>
                        <input type="text" placeholder="Nhập email hoặc username" required />
                    </div>

                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input type="password" placeholder="Nhập mật khẩu" required />
                    </div>

                    <button type="submit" className="login-btn">
                        Đăng nhập
                    </button>
                </form>

                <div className="extra">
                    <a href="#forgot">Quên mật khẩu?</a>
                    <a href="#register">Đăng ký</a>
                </div>

                <div className="divider">hoặc</div>

                <div className="social-login">
                    <button className="social-btn">Google</button>
                    <button className="social-btn">Facebook</button>
                </div>

                <div className="footer">
                    Chưa có tài khoản? <a href="#create">Tạo tài khoản mới</a>
                </div>
            </div>
        </div>
    );
};

export default Login;