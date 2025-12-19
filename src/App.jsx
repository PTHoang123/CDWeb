import ChatLayout from "./components/ChatLayout";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import "./App.css";

function App() {
  return (
    <ChatLayout
      // sidebar={<Sidebar activeId="c1" />}
      chat={<ChatWindow title="Hội anh em 36" />}
    />
  );
}

export default App;
