import ChatLayout from "./components/ChatLayout";
import Sidebar from "./components/Navigation/Sidebar";
import ChatWindow from "./components/ChatWindow/ChatWindow.jsx";
import ConversationList from "./components/ConversationList/ConversationList.jsx";
import "./App.css";

function App() {
    return (
        <ChatLayout
            navigation={<Sidebar/>}
            sidebar={<ConversationList/>}
            chat={<ChatWindow title="Hội anh em 36"/>}
        />
    );
}

export default App;