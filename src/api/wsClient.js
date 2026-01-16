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

  // Prevent StrictMode mount/unmount during initial connect
  let isConnecting = false;

  const listeners = {
    open: new Set(),
    close: new Set(),
    error: new Set(),
    message: new Set(),
    json: new Set(),
  };

  const log = (...args) => logger?.(...args);

    const debug = (...args) => {
        if (logger) logger("[WS]", ...args);
    };

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
    debug("CONNECTING TO", url);
    manualClose = false;
    isConnecting = true;
    ws = new WebSocket(url);

    const openPromise = new Promise((resolve) => {
      openPromiseResolve = resolve;
    });

    ws.onopen = () => {
      isConnecting = false;
      attempt = 0;
      openPromiseResolve?.();
      debug("CONNECTED");
      emit("open");
    };

    ws.onmessage = (event) => {
      debug("RAW MESSAGE", event.data);
      emit("message", event);
      try {
        const data = JSON.parse(event.data);
        debug("JSON", data);
        emit("json", data);
      } catch {
        // ignore JSON parse errors
          debug("NON JSON", event.data);
      }
    };

    ws.onerror = (event) => {
      emit("error", event);
    };

    ws.onclose = (event) => {
      isConnecting = false;
      debug("CLOSED", event.code, event.reason);
      emit("close", event);

      // Only auto-reconnect if it wasn't closed manually
      if (!manualClose && reconnect) {
        attempt += 1;
        const delay = computeDelay();
        debug("RECONNECT in", delay, "ms");
        setTimeout(() => {
          if (!manualClose) connect();
        }, delay);
      }
    };

    return openPromise;
  }

  function close(code = 1000, reason = "") {
    // In React StrictMode dev, effects mount/unmount twice.
    // Avoid force-closing during the initial opening handshake.
    if (isConnecting) {
      manualClose = false;
      return;
    }

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

    // if it's currently connecting, wait for open
    if (ws.readyState === WebSocket.CONNECTING) {
      return new Promise((resolve, reject) => {
        const h = () => {
          off("open", h);
          off("close", hc);
          resolve();
        };
        const hc = (evt) => {
          off("open", h);
          off("close", hc);
          reject(new Error(evt?.reason || "WebSocket closed before opening"));
        };
        on("open", h);
        on("close", hc);
      });
    }

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
    debug("SEND", data);
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
