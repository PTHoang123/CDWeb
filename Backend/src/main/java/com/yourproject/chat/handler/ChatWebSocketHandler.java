package com.yourproject.chat.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yourproject.chat.dto.ChatRequest;
import com.yourproject.chat.dto.ChatResponse;
import com.yourproject.chat.entity.ChatMessage;
import com.yourproject.chat.entity.User;
import com.yourproject.chat.repository.ChatMessageRepository;
import com.yourproject.chat.repository.UserRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, WebSocketSession> activeSessions = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, String> sessionUsernames = new ConcurrentHashMap<>();

    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;

    public ChatWebSocketHandler(UserRepository userRepository, ChatMessageRepository chatMessageRepository) {
        this.userRepository = userRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        activeSessions.put(session.getId(), session);
        System.out.println("New connection: " + session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        activeSessions.remove(session.getId());
        sessionUsernames.remove(session);
        System.out.println("Connection closed: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            ChatRequest request = mapper.readValue(message.getPayload(), ChatRequest.class);
            if ("onchat".equals(request.getAction()) && request.getData() != null) {
                String event = request.getData().getEvent();
                JsonNode data = request.getData().getData();

                switch (event) {
                    case "REGISTER":
                        handleRegister(session, data);
                        break;
                    case "RE_LOGIN":
                        handleRelogin(session, data);
                        break;
                    case "LOGIN":
                        handleLogin(session, data);
                        break;
                    case "SEND_CHAT":
                        handleSendChat(session, data);
                        break;
                    case "CHECK_USER_EXIST":
                        handleCheckUserExist(session, data);
                        break;
                    case "CHECK_USER_ONLINE":
                        handleCheckUserOnline(session, data);
                        break;
                    case "GET_USER_LIST":
                        handleGetUserList(session, data);
                        break;
                    case "GET_PEOPLE_CHAT_MES":
                        handleGetPeopleChatMes(session, data);
                        break;
                    case "GET_ROOM_CHAT_MES":
                        handleGetRoomChatMes(session, data);
                        break;
                    case "CREATE_ROOM":
                        handleCreateRoom(session, data);
                        break;
                    case "JOIN_ROOM":
                        handleJoinRoom(session, data);
                        break;
                    case "WEBRTC_SIGNAL":
                        handleWebRTCSignal(session, data);
                        break;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void handleRegister(WebSocketSession session, JsonNode data) throws Exception {
        String user = data.has("user") ? data.get("user").asText() : "";
        String pass = data.has("pass") ? data.get("pass").asText() : "";

        ChatResponse response = new ChatResponse();
        response.setEvent("REGISTER");

        if (user.isEmpty() || pass.isEmpty()) {
            response.setStatus("error");
            response.setMes("Tài khoản và mật khẩu không được để trống");
        } else if (userRepository.findByUsername(user) != null) {
            response.setStatus("error");
            response.setMes("Tài khoản đã tồn tại!");
        } else {
            User newUser = new User();
            newUser.setUsername(user);
            newUser.setPassword(pass);
            userRepository.save(newUser);

            response.setStatus("success");
            response.setMes("Đăng ký thành công!");
        }
        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
    }

    private void handleLogin(WebSocketSession session, JsonNode data) throws Exception {
        String user = data.has("user") ? data.get("user").asText() : "";
        String pass = data.has("pass") ? data.get("pass").asText() : "";

        ChatResponse response = new ChatResponse();
        response.setEvent("LOGIN");
        
        User existingUser = userRepository.findByUsername(user);
        
        if (existingUser == null || !existingUser.getPassword().equals(pass)) {
            response.setStatus("error");
            response.setMes("Sai tài khoản hoặc mật khẩu");
        } else {
            response.setStatus("success");
            response.setMes("Đăng nhập thành công");
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("RE_LOGIN_CODE", UUID.randomUUID().toString());
            responseData.put("username", user);
            response.setData(responseData);
            
            sessionUsernames.put(session, user);
        }
        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
    }

    private void handleRelogin(WebSocketSession session, JsonNode data) throws Exception {
        String user = data.has("user") ? data.get("user").asText() : "";
        ChatResponse response = new ChatResponse();
        response.setEvent("RE_LOGIN");

        User existingUser = userRepository.findByUsername(user);
        if (existingUser != null) {
            response.setStatus("success");
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("RE_LOGIN_CODE", UUID.randomUUID().toString());
            responseData.put("username", user);
            response.setData(responseData);
            sessionUsernames.put(session, user);
        } else {
            response.setStatus("error");
            response.setMes("Phiên đăng nhập không hợp lệ");
        }
        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
    }

    private void handleSendChat(WebSocketSession session, JsonNode data) throws Exception {
        String type = data.has("type") ? data.get("type").asText() : "people";
        String to = data.has("to") ? data.get("to").asText() : "";
        String mes = data.has("mes") ? data.get("mes").asText() : "";
        String fromUser = sessionUsernames.get(session);

        // 1. Lưu tin nhắn vào Database
        ChatMessage chatMsg = new ChatMessage();
        chatMsg.setType(type);
        chatMsg.setRecipient(to);
        chatMsg.setSender(fromUser);
        chatMsg.setContent(mes);
        chatMessageRepository.save(chatMsg);

        // 2. Phản hồi cho Frontend
        ChatResponse response = new ChatResponse();
        response.setEvent("SEND_CHAT");
        response.setStatus("success");

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", type);
        payload.put("to", to);
        payload.put("from", fromUser);
        payload.put("mes", mes);
        payload.put("time", chatMsg.getCreatedAt());
        response.setData(payload);

        TextMessage textMessage = new TextMessage(mapper.writeValueAsString(response));
        
        if ("people".equals(type)) {
            // Chỉ gửi tin nhắn cho người nhận và các tab khác của người gửi (Tránh lặp tin nhắn)
            for (Map.Entry<WebSocketSession, String> entry : sessionUsernames.entrySet()) {
                String username = entry.getValue();
                WebSocketSession s = entry.getKey();
                if (s.isOpen()) {
                    if (username.equals(to) || (username.equals(fromUser) && !s.getId().equals(session.getId()))) {
                        s.sendMessage(textMessage);
                    }
                }
            }
        } else {
            // Nếu là Room thì gửi cho tất cả trừ người vừa gửi
            for (WebSocketSession s : activeSessions.values()) {
                if (s.isOpen() && !s.getId().equals(session.getId())) {
                    s.sendMessage(textMessage);
                }
            }
        }
    }

    private void handleGetPeopleChatMes(WebSocketSession session, JsonNode data) throws Exception {
        String to = "";
        if (data != null) {
            if (data.has("to")) to = data.get("to").asText();
            else if (data.has("name")) to = data.get("name").asText(); // <-- Bổ sung tìm 'name'
        }
        String fromUser = sessionUsernames.get(session);

        List<ChatMessage> messages = chatMessageRepository.findConversation(fromUser, to);
        List<Map<String, Object>> chatData = new ArrayList<>();
        
        for (ChatMessage m : messages) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("name", m.getSender());
            map.put("to", m.getRecipient());
            map.put("mes", m.getContent());
            map.put("createAt", m.getCreatedAt());
            chatData.add(map);
        }

        ChatResponse response = new ChatResponse();
        response.setEvent("GET_PEOPLE_CHAT_MES");
        response.setStatus("success");
        response.setData(chatData);
        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
    }
    private void handleCheckUserExist(WebSocketSession session, JsonNode data) throws Exception {
        String userToCheck = "";
        if (data != null) {
            if (data.has("user")) userToCheck = data.get("user").asText();
            else if (data.has("username")) userToCheck = data.get("username").asText();
            else if (data.has("name")) userToCheck = data.get("name").asText();
        }

        ChatResponse response = new ChatResponse();
        response.setEvent("CHECK_USER_EXIST");

        User existingUser = userRepository.findByUsername(userToCheck);
        Map<String, Object> responseData = new HashMap<>();

        if (existingUser != null) {
            response.setStatus("success");
            responseData.put("status", true);
            responseData.put("user", existingUser.getUsername());
        } else {
            response.setStatus("error");
            responseData.put("status", false);
        }
        response.setData(responseData);
        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
    }

    private void handleGetRoomChatMes(WebSocketSession session, JsonNode data) throws Exception {
        String room = "";
        if (data != null) {
            if (data.has("to")) room = data.get("to").asText();
            else if (data.has("name")) room = data.get("name").asText();
        }

        List<ChatMessage> messages = chatMessageRepository.findRoomMessages(room);
        List<Map<String, Object>> chatData = new ArrayList<>();
        
        for (ChatMessage m : messages) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("name", m.getSender());
            map.put("to", m.getRecipient());
            map.put("mes", m.getContent());
            map.put("createAt", m.getCreatedAt());
            chatData.add(map);
        }

        ChatResponse response = new ChatResponse();
        response.setEvent("GET_ROOM_CHAT_MES");
        response.setStatus("success");
        response.setData(chatData);
        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
    }

    private void handleCheckUserOnline(WebSocketSession session, JsonNode data) throws Exception {
        String userToCheck = "";
        if (data != null) {
            if (data.has("user")) userToCheck = data.get("user").asText();
            else if (data.has("username")) userToCheck = data.get("username").asText();
            else if (data.has("name")) userToCheck = data.get("name").asText();
        }

        ChatResponse response = new ChatResponse();
        response.setEvent("CHECK_USER_ONLINE");
        response.setStatus("success");

        boolean isOnline = sessionUsernames.containsValue(userToCheck);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("status", isOnline);
        responseData.put("user", userToCheck);
        response.setData(responseData);

        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
    }

    private void handleGetUserList(WebSocketSession session, JsonNode data) throws Exception {
        ChatResponse response = new ChatResponse();
        response.setEvent("GET_USER_LIST");
        response.setStatus("success");

        String currentUser = sessionUsernames.get(session);
        List<User> interactedUsers = new ArrayList<>();
        if (currentUser != null) {
            interactedUsers = userRepository.findInteractedUsers(currentUser);
        }
        List<Map<String, Object>> userList = new ArrayList<>();

        for (User u : interactedUsers) {
            // Không gửi chính mình trong danh sách
            if (currentUser != null && currentUser.equals(u.getUsername())) continue;

            Map<String, Object> userMap = new HashMap<>();
            userMap.put("name", u.getUsername());
            userMap.put("type", 0); // 0 đại diện cho user cá nhân (people)
            userList.add(userMap);
        }

        // Thêm danh sách Nhóm (Room) chung cho tất cả mọi người
        if (currentUser != null) {
            List<String> allRooms = chatMessageRepository.findAllActiveRooms();
            for (String room : allRooms) {
                Map<String, Object> roomMap = new HashMap<>();
                roomMap.put("name", room);
                roomMap.put("type", 1); // 1 đại diện cho room
                userList.add(roomMap);
            }
        }

        response.setData(userList);
        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
    }

    private void handleCreateRoom(WebSocketSession session, JsonNode data) throws Exception {
        String roomName = data.has("name") ? data.get("name").asText() : "";
        String currentUser = sessionUsernames.get(session);

        // 1. Lưu tạm 1 tin nhắn hệ thống vào DB để phòng được lưu vĩnh viễn (Không bị mất khi F5)
        ChatMessage initMsg = new ChatMessage();
        initMsg.setType("room");
        initMsg.setRecipient(roomName);
        initMsg.setSender(currentUser);
        initMsg.setContent(currentUser + " đã tạo nhóm chat");
        chatMessageRepository.save(initMsg);

        ChatResponse response = new ChatResponse();
        response.setEvent("CREATE_ROOM");
        response.setStatus("success");

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("name", roomName);
        responseData.put("owner", currentUser);
        response.setData(responseData);

        // 2. Gửi thông báo cho TẤT CẢ những người đang online để hiển thị ngay lập tức
        TextMessage textMessage = new TextMessage(mapper.writeValueAsString(response));
        for (WebSocketSession s : activeSessions.values()) {
            if (s.isOpen()) s.sendMessage(textMessage);
        }
    }

    private void handleJoinRoom(WebSocketSession session, JsonNode data) throws Exception {
        String roomName = data.has("name") ? data.get("name").asText() : "";

        ChatResponse response = new ChatResponse();
        response.setEvent("JOIN_ROOM");
        response.setStatus("success");

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("name", roomName);
        response.setData(responseData);

        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
    }

    private void handleWebRTCSignal(WebSocketSession session, JsonNode data) throws Exception {
        String to = data.has("to") ? data.get("to").asText() : "";
        String fromUser = sessionUsernames.get(session);

        ChatResponse response = new ChatResponse();
        response.setEvent("WEBRTC_SIGNAL");
        response.setStatus("success");

        Map<String, Object> payload = new HashMap<>();
        payload.put("from", fromUser);
        payload.put("to", to);
        if (data.has("signalType")) payload.put("signalType", data.get("signalType").asText());
        if (data.has("sdp")) payload.put("sdp", data.get("sdp"));
        if (data.has("candidate")) payload.put("candidate", data.get("candidate"));

        response.setData(payload);
        TextMessage textMessage = new TextMessage(mapper.writeValueAsString(response));

        for (Map.Entry<WebSocketSession, String> entry : sessionUsernames.entrySet()) {
            if (entry.getValue().equals(to) && entry.getKey().isOpen()) {
                entry.getKey().sendMessage(textMessage);
            }
        }
    }
}
