import React, { useState } from "react";
import "./loginStyle.css";
import useWs from "../context/useWs";
import { wsRegister } from "../api/chatApi";

const IMG_WELCOME = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44b.png"; // Ảnh Hi/Welcome
const IMG_HAPPY = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f973.png";
export default function Register({ onBackToLogin }) {
  const { client, connected } = useWs();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // REGISTER is only about creating an account on the WS server.
      await wsRegister(client, username.trim(), password);
      setSuccess(
        "Register request sent. Check server response / try login now."
      );
    } catch (err) {
      setError(err?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-body-wrapper">
      <div className="login-container">
        <div className="app-title">Chatify</div>
        <div className="subtitle">Create a new account</div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <button
            type="button"
            onClick={onBackToLogin}
            className="btn-outline"
          >
            ← Back
          </button>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
           WS: {connected ? "Online 🟢" : "Connecting... 🟠"}
          </span>
        </div>

        <div className="mascot-container">
          <img
              src={success ? IMG_HAPPY : IMG_WELCOME}
              alt="Status Mascot"
              className="mascot-img"
          />
        </div>

        {error && (
          <div style={{ color: "red", fontSize: 13, marginBottom: 10 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ color: "#19c37d", fontSize: 13, marginBottom: 10 }}>
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
          Note: This registers an account on the WS server (not Google).
        </div>
      </div>
    </div>
  );
}
