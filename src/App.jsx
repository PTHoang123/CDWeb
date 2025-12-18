import ChatLayout from "./components/ChatLayout";
import "./App.css";

function App() {
  return (
    <ChatLayout
      sidebar={
        <div style={{ padding: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Chats</div>
          <input
            placeholder="Search"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.12)",
              background: "rgba(255,255,255,.04)",
              color: "inherit",
              outline: "none",
            }}
          />
        </div>
      }
      chat={
        <div style={{ padding: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Chat</div>
          <div style={{ opacity: 0.7 }}>Select a conversation…</div>
        </div>
      }
      details={<div style={{ padding: 16, opacity: 0.7 }}>Details</div>}
    />
  );
}

export default App;
