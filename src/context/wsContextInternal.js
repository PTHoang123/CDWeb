import { createContext } from "react";

// Internal (not a component). Keep separate so Fast Refresh doesn't complain.
export const WsContext = createContext(null);
