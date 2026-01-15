import React from "react";
import useWsContextInternal, { WsContext } from "./wsContextInternal";
// import { useWsClient } from "../hooks/useWsClient";
// import { WsContext } from "./wsContextInternal";

export function WsProvider({ children, url}) {
    const values = useWsContextInternal(url);
  // const { client, connected } = useWsClient(url);
  return (
    <WsContext.Provider value={values}>
      {children}
    </WsContext.Provider>
  );
}

export { WsContext };