import { useContext } from "react";
import { WsContext } from "./wsContextInternal";

export default function useWs() {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error("useWs must be used within WsProvider");
  return ctx;
}
