import {useEffect, useMemo, useState} from "react";
import {createWsClient} from "../api/wsClient";

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
        const offOpen = client.on("open", () => {
            console.log("[WS] CONNECTED");
            setConnected(true);
        });

        const offClose = client.on("close", () => {
            console.log("[WS] DISCONNECTED");
            setConnected(false);
        });

        const offJson = client.on("json", (msg) => {
            // log những event quan trọng
            if (["RE_LOGIN", "LOGIN", "CREATE_ROOM", "JOIN_ROOM", "GET_USER_LIST"].includes(msg?.event)) {
                console.log("[WS][EVENT]", msg.event, msg);
            }
        });

        console.log("[WS] CONNECT()");

        client.connect();

        return () => {
            offOpen();
            offClose();
            offJson();
            console.log("[WS] CONNECT()");
            client.close();
        };
    }, [client]);

    return {client, connected};
}
