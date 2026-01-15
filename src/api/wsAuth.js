import {wsRelogin, wsLogout} from "./chatApi";

// WebSocket-based authentication using the shared WsClient

export async function loginOverWs(
    client,
    username,
    password,
    {timeoutMs = 10000} = {}
) {
    const request = {
        action: "onchat",
        data: {
            event: "LOGIN",
            data: {
                user: username,
                pass: password,
            },
        },
    };

    return new Promise((resolve, reject) => {
        let done = false;

        const timer = setTimeout(() => {
            if (done) return;
            done = true;
            off();
            reject(new Error("Login timeout"));
        }, timeoutMs);

        const off = client.on("json", (response) => {
            // Observed response format:
            // { event: 'LOGIN', status: 'success', data: { RE_LOGIN_CODE: '...' } }
            if (response?.event !== "LOGIN") return;

            clearTimeout(timer);
            if (done) return;
            done = true;
            off();


            if (response.status === "success") {
                resolve({
                    username,
                    RE_LOGIN_CODE: response?.data?.RE_LOGIN_CODE,
                });
            } else {
                reject(new Error(response.mes || "Đăng nhập thất bại"));
            }
        });

        client.sendJson(request).catch(() => {
            clearTimeout(timer);
            if (done) return;
            done = true;
            off();
            reject(new Error("Không thể kết nối đến server"));
        });
    });
}

// Hàm xử lý relogin
export async function reloginOverWs(
    client,
    username,
    code,
    {timeoutMs = 10000} = {}
) {
    // Send RE_LOGIN
    await wsRelogin(client, username, code);

    // Wait for any server confirmation. Your docs do not show the response event,
    // so we resolve on first non-error response that references RE_LOGIN.
    return new Promise((resolve, reject) => {
        let done = false;

        const timer = setTimeout(() => {
            if (done) return;
            done = true;
            off();
            reject(new Error("Re-login timeout"));
        }, timeoutMs);

        const off = client.on("json", (response) => {
            const ev = response?.event;
            if (ev !== "RE_LOGIN" && ev !== "LOGIN") return;

            clearTimeout(timer);
            if (done) return;
            done = true;
            off();

            if (response?.status && response.status !== "success") {
                reject(new Error(response.mes || "Re-login failed"));
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * Hàm xử lý đăng xuất
 * 1. Gửi lệnh LOGOUT lên server (Fire and forget - Gửi và không cần chờ phản hồi phức tạp)
 * 2. (Tuỳ chọn) Đóng kết nối nếu cần thiết kế bảo mật cao, nhưng thường chat app giữ kết nối để login lại nhanh.
 */
export async function logoutOverWs(client) {
    if (!client || !client.isOpen()) {
        console.warn("Client chưa kết nối, chỉ thực hiện logout ở Client.");
        return;
    }

    try {
        // Gọi hàm wsLogout đã có sẵn trong chatApi.js
        await wsLogout(client);
        console.log("Đã gửi lệnh LOGOUT lên Server");
    } catch (error) {
        console.error("Lỗi khi gửi lệnh logout:", error);
    }
}



