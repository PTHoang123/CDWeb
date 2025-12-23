import ChatLayout from "./components/ChatLayout";
import Sidebar from "./components/Navigation/Sidebar";
import ChatWindow from "./components/ChatWindow/ChatWindow.jsx";
import "./App.css";

function App() {
    return (
        <ChatLayout
            navigation={<Sidebar/>}  // thanh công cụ
            sidebar={<div>Danh sánh tin nhắn chờ</div>}// để tạm tạm trước
            chat={<ChatWindow title="Hội anh em 36"/>}
        />
    );
}

export default App;
