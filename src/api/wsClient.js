export function createWsClient(
  url,
  {
    reconnect = true,
    reconnectMinDelayMs = 500,
    reconnectMaxDelayMs = 8000,
    logger = null,
  } = {}
) {
  let ws = null;
  let manualClose = false;
  let attempt = 0;
  let openPromiseResolve = null;

  const listeners = {
    open: new Set(),
    close: new Set(),
    error: new Set(),
    message: new Set(),
    json: new Set(),
  };

  const log = (...args) => logger?.(...args);

  function emit(type, payload) {
    for (const fn of listeners[type]) {
      try {
        fn(payload);
      } catch (e) {
        log?.("listener error", e);
      }
    }
  }

  function computeDelay() {
    const base = Math.min(
      reconnectMaxDelayMs,
      reconnectMinDelayMs * 2 ** attempt
    );
    // jitter 0.75x-1.25x
    const jitter = base * (0.75 + Math.random() * 0.5);
    return Math.round(jitter);
  }

  function connect() {
    manualClose = false;
    ws = new WebSocket(url);

    const openPromise = new Promise((resolve) => {
      openPromiseResolve = resolve;
    });

    ws.onopen = () => {
      attempt = 0;
      openPromiseResolve?.();
      emit("open");
    };

    ws.onmessage = (event) => {
      emit("message", event);
      try {
        const data = JSON.parse(event.data);
        emit("json", data);
      } catch {
        // ignore JSON parse errors
      }
    };

    ws.onerror = (event) => {
      emit("error", event);
    };

    ws.onclose = (event) => {
      emit("close", event);

      // Only auto-reconnect if it wasn't closed manually
      if (!manualClose && reconnect) {
        attempt += 1;
        const delay = computeDelay();
        log?.("ws reconnect in", delay, "ms");
        setTimeout(() => {
          if (!manualClose) connect();
        }, delay);
      }
    };

    return openPromise;
  }

  function close(code = 1000, reason = "") {
    manualClose = true;
    ws?.close(code, reason);
  }

  function isOpen() {
    return ws?.readyState === WebSocket.OPEN;
  }

  function waitForOpen() {
    if (isOpen()) return Promise.resolve();
    // if not created yet, create one
    if (!ws || ws.readyState === WebSocket.CLOSED) return connect();
    // otherwise wait on next open
    return new Promise((resolve, reject) => {
      const h = () => {
        off("open", h);
        resolve();
      };
      on("open", h);
      // if it closes before open
      const hc = () => {
        off("close", hc);
        reject(new Error("WebSocket closed before opening"));
      };
      on("close", hc);
    });
  }

  function send(data) {
    if (!ws)
      throw new Error("WebSocket not initialized. Call connect() first.");
    ws.send(data);
  }

  async function sendJson(obj) {
    await waitForOpen();
    send(JSON.stringify(obj));
  }

  function on(type, handler) {
    listeners[type].add(handler);
    return () => off(type, handler);
  }

  function off(type, handler) {
    listeners[type].delete(handler);
  }

  function getSocket() {
    return ws;
  }

  return {
    connect,
    close,
    isOpen,
    waitForOpen,
    send,
    sendJson,
    on,
    off,
    getSocket,
  };
}
