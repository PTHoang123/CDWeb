// src/api/auth.js
const WS_URL = 'wss://chat.longapp.site/chat/chat'; // URL của giảng viên

export const loginWithWS = (username, password) => {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(WS_URL);

        // Thiết lập timeout 10 giây
        const timeout = setTimeout(() => {
            socket.close();
            reject(new Error("Hết thời gian chờ phản hồi từ server"));
        }, 10000);

        socket.onopen = () => {
            const payload = {
                action: "onchat",
                data: {
                    event: "LOGIN",
                    data: { user: username, pass: password }
                }
            };
            socket.send(JSON.stringify(payload));
        };

        socket.onmessage = (event) => {
            const response = JSON.parse(event.data);

            if (response.status === "success" && response.event === "RE_LOGIN") {
                clearTimeout(timeout); // Xóa timeout khi thành công
                resolve({
                    userData: response.data,
                    socket: socket
                });
            } else if (response.event === "RE_LOGIN") { // Sai pass hoặc user
                clearTimeout(timeout);
                reject(new Error(response.mes || "Thông tin đăng nhập không chính xác"));
                socket.close();
            }
        };

        socket.onerror = () => {
            clearTimeout(timeout);
            reject(new Error("Lỗi kết nối vật lý đến Server"));
        };
    });
};