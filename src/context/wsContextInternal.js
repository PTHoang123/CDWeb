import { useState, useEffect, createContext } from "react"; // [THÊM] createContext
import { useWsClient } from "../hooks/useWsClient";
import { reLoginOverWs } from "../api/wsAuth";

// Internal (not a component). Keep separate so Fast Refresh doesn't complain.
export const WsContext = createContext(null);

const useWsContextInternal = () => {
    const { client, connected } = useWsClient();
    const [user, setUser] = useState(null);
    const [isRelogging, setIsRelogging] = useState(false);

    // --- LOGIC RE-LOGIN ---
    useEffect(() => {
        if (connected && client && !user) {
            const checkAndLogin = async () => {
                const savedUser = localStorage.getItem("chat_user");
                const savedPass = localStorage.getItem("chat_pass");

                if (savedUser && savedPass && !isRelogging) {
                    console.log("🔄 Auto Re-login cho:", savedUser);
                    setIsRelogging(true);
                    try {
                        const userData = await reLoginOverWs(client, savedUser, savedPass);
                        console.log("✅ Re-login thành công");
                        setUser(userData || { name: savedUser, id: savedUser });
                    } catch (err) {
                        console.error("❌ Re-login thất bại:", err.message);
                        localStorage.removeItem("chat_user");
                        localStorage.removeItem("chat_pass");
                    } finally {
                        setIsRelogging(false);
                    }
                }
            };
            checkAndLogin();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected, client, user]);

    return {
        client,
        connected,
        user,
        setUser,
        isRelogging,
    };
};

export default useWsContextInternal;