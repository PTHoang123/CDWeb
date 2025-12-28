// WebSocket-based authentication using the shared WsClient
// Protocol matches your current `loginWithWS` in `src/api/auth.js`

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
      // Expect: { status: 'success', event: 'RE_LOGIN', data: {...} }
      if (response?.event !== "RE_LOGIN") return;

      clearTimeout(timer);
      if (done) return;
      done = true;
      off();

      if (response.status === "success") {
        resolve(response.data);
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
