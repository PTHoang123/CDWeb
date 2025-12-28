import { useEffect, useMemo, useState } from "react";
import { createWsClient } from "../api/wsClient";

export function useWsClient(url) {
  const client = useMemo(
    () =>
      createWsClient(url, {
        reconnect: true,
        logger: (...args) => console.debug("[ws]", ...args),
      }),
    [url]
  );

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const offOpen = client.on("open", () => setConnected(true));
    const offClose = client.on("close", () => setConnected(false));

    client.connect();

    return () => {
      offOpen();
      offClose();
      client.close();
    };
  }, [client]);

  return { client, connected };
}
