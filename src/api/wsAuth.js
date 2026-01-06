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
      if (response?.event !== "RE_LOGIN") return;

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
