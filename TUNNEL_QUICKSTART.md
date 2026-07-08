# Quick Tunnel Setup for Call Testing

This project can be tested from two different machines without being on the same LAN by exposing the backend through a tunnel.

## One-command mode

If `cloudflared` is installed, run this from the project root:

```bash
bash ./dev-tunnel.sh
```

That command starts the backend, opens a Cloudflare quick tunnel, and launches the frontend with the tunnel URL already injected into Vite env.

If port `8082` is already occupied, the script will automatically pick another free backend port.

## Fastest path

1. Start the backend locally:

```bash
cd Backend
mvn spring-boot:run
```

2. Expose the backend with a tunnel.

Example with ngrok:

```bash
ngrok http 8082
```

You will get a public HTTPS URL like `https://xxxxx.ngrok-free.app`.

3. Set the frontend env to point to that backend URL.

Create `Frontend/.env.local` from `Frontend/.env.example` and set:

```bash
VITE_API_BASE_URL=https://xxxxx.ngrok-free.app
VITE_WS_URL=wss://xxxxx.ngrok-free.app/chat/chat
```

4. Allow the frontend origin in the backend.

For the fastest test, you can set:

```bash
APP_CORS_ALLOWED_ORIGINS=*
```

If you want stricter access, set it to the exact frontend origin instead.

5. Start the frontend locally:

```bash
cd Frontend
npm run dev
```

If you already used `bash ./dev-tunnel.sh`, you do not need the manual steps above.

## What this enables

- Login and chat messages go through the tunnel backend.
- Voice/call signaling uses the same WebSocket backend endpoint.
- Browser media capture works because the tunnel is HTTPS.

## Important note

WebRTC still relies on NAT traversal. The current project uses Google STUN, so most home networks work fine. If calls connect inconsistently across networks, add a TURN server later.