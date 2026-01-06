import { wsRelogin } from "./chatApi";

// WebSocket-based authentication using the shared WsClient

export async function loginOverWs(
  client,
  username,
  password,
  { timeoutMs = 10000 } = {}
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

export async function reloginOverWs(
  client,
  username,
  code,
  { timeoutMs = 10000 } = {}
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
