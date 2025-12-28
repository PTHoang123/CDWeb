// src/api/auth.js
// NOTE: This file previously created its own WebSocket connection.
// For the "single WS for everything" approach, use `loginOverWs` from `src/api/wsAuth.js`
// with the shared WsClient from context.

const WS_URL = "wss://chat.longapp.site/chat/chat"; // URL của giảng viên

export const loginWithWS = (username, password) => {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(WS_URL);

    // Khi kết nối thành công
    socket.onopen = () => {
      const payload = {
        action: "onchat",
        data: {
          event: "LOGIN",
          data: {
            user: username,
            pass: password,
          },
        },
      };
      socket.send(JSON.stringify(payload)); // Gửi yêu cầu đăng nhập
    };

    // Khi nhận được phản hồi từ server
    socket.onmessage = (event) => {
      const response = JSON.parse(event.data);

      // Dựa vào cấu trúc ảnh thầy gửi: status: "success"
      if (response.status === "success" && response.event === "RE_LOGIN") {
        resolve({
          userData: response.data,
          socket: socket, // Trả về socket để các trang sau dùng tiếp
        });
      } else {
        reject(new Error(response.mes || "Đăng nhập thất bại"));
        socket.close();
      }
    };

    socket.onerror = () => {
      reject(new Error("Không thể kết nối đến server"));
    };
  });
};
