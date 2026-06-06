import React from "react";

export default function WsStatus({ connected }) {
  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        border: "1px solid rgba(255,255,255,.12)",
        background: connected ? "rgba(0,200,120,.18)" : "rgba(255,180,0,.14)",
      }}
    >
      {connected ? "WS Connected" : "WS Connecting..."}
    </div>
  );
}
