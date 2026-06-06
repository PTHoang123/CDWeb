import {useState, useEffect, createContext} from "react";
import {useWsClient} from "../hooks/useWsClient";
import {reloginOverWs} from "../api/wsAuth";

export const WsContext = createContext(null);

const useWsContextInternal = (url) => {
    const {client, connected} = useWsClient(url);
    const [user, setUser] = useState(undefined);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        if (!connected || !client) return;

        const run = async () => {
            const savedUser = localStorage.getItem("chat_user");
            const savedCode = localStorage.getItem("chat_relogin_code");

            if (!savedUser || !savedCode) {
                setUser(null);
                setAuthReady(true);
                return;
            }

            console.log("🔄 Auto Re-login cho:", savedUser);

            try {
                const res = await reloginOverWs(client, savedUser, savedCode);
                console.log("✅ Re-login thành công", res);

                const newCode = res?.data?.RE_LOGIN_CODE || res?.RE_LOGIN_CODE;
                if (newCode) {
                    localStorage.setItem("chat_relogin_code", newCode);
                }
                const userInfo = res?.data?.user || res?.user || {
                    username: savedUser,  // Đổi từ 'name' thành 'username'
                    id: savedUser
                };
                setUser(userInfo);
            } catch (err) {
                console.error("❌ Re-login thất bại:", err.message);
                localStorage.removeItem("chat_user");
                localStorage.removeItem("chat_relogin_code");
                setUser(null);
            } finally {
                setAuthReady(true);
            }
        };

        run();
    }, [connected, client]);

    return {client, connected, user, setUser, authReady};
};

export default useWsContextInternal;