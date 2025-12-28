import React from "react";
import { useWsClient } from "../hooks/useWsClient";
import { WsContext } from "./wsContextInternal";

export function WsProvider({ url, children }) {
  const { client, connected } = useWsClient(url);
  return (
    <WsContext.Provider value={{ client, connected }}>
      {children}
    </WsContext.Provider>
  );
}
