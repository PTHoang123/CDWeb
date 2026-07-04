package com.yourproject.chat.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yourproject.chat.dto.ChatRequest;
import com.yourproject.chat.dto.ChatResponse;
import com.yourproject.chat.entity.ChatMessage;
import com.yourproject.chat.entity.User;
import com.yourproject.chat.repository.ChatMessageRepository;
import com.yourproject.chat.repository.UserRepository;
import com.yourproject.chat.service.JwtService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper mapper = new ObjectMapper();
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // sessionId → Session
    private final Map<String, WebSocketSession> activeSessions = new ConcurrentHashMap<>();

    // Session → username (chỉ có sau khi login/relogin thành công)
    private final Map<WebSocketSession, String> sessionUsernames = new ConcurrentHashMap<>();

    // roomName → Set<Session> (quản lý thành viên từng room)
    private final Map<String, Set<WebSocketSession>> roomMembers = new ConcurrentHashMap<>();

    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final JwtService jwtService;

    public ChatWebSocketHandler(
            UserRepository userRepository,
            ChatMessageRepository chatMessageRepository,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.jwtService = jwtService;
    }

    // ─────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        activeSessions.put(session.getId(), session);
        System.out.println("[WS] Kết nối mới: " + session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        activeSessions.remove(session.getId());
        sessionUsernames.remove(session);

        // Xóa session khỏi TẤT CẢ các room khi ngắt kết nối
        roomMembers.values().forEach(members -> members.remove(session));

        System.out.println("[WS] Đóng kết nối: " + session.getId());
    }

    // ─────────────────────────────────────────────
    // Message routing
    // ─────────────────────────────────────────────

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            ChatRequest request = mapper.readValue(message.getPayload(), ChatRequest.class);
            if (!"onchat".equals(request.getAction()) || request.getData() == null) return;

            String event = request.getData().getEvent();
            JsonNode data = request.getData().getData();

            switch (event) {
                case "REGISTER":           handleRegister(session, data);          break;
                case "LOGIN":              handleLogin(session, data);             break;
                case "RE_LOGIN":           handleRelogin(session, data);           break;
                case "SEND_CHAT":          handleSendChat(session, data);          break;
                case "CHECK_USER_EXIST":   handleCheckUserExist(session, data);    break;
                case "CHECK_USER_ONLINE":  handleCheckUserOnline(session, data);   break;
                case "GET_USER_LIST":      handleGetUserList(session, data);       break;
                case "GET_PEOPLE_CHAT_MES":handleGetPeopleChatMes(session, data);  break;
                case "GET_ROOM_CHAT_MES":  handleGetRoomChatMes(session, data);    break;
                case "CREATE_ROOM":        handleCreateRoom(session, data);        break;
                case "JOIN_ROOM":          handleJoinRoom(session, data);          break;
                case "WEBRTC_SIGNAL":      handleWebRTCSignal(session, data);      break;
                default:
                    sendError(session, event, "Sự kiện không được hỗ trợ: " + event);
            }
        } catch (Exception e) {
            System.err.println("[WS] Lỗi xử lý message: " + e.getMessage());
            e.printStackTrace();
            sendError(session, "ERROR", "Lỗi xử lý yêu cầu: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────
    // Auth handlers
    // ─────────────────────────────────────────────

    private void handleRegister(WebSocketSession session, JsonNode data) throws Exception {
        String user = getString(data, "user");
        String pass = getString(data, "pass");

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
            newUser.setPassword(passwordEncoder.encode(pass)); // BCrypt hash
            userRepository.save(newUser);

            response.setStatus("success");
            response.setMes("Đăng ký thành công!");
        }
        send(session, response);
    }

    private void handleLogin(WebSocketSession session, JsonNode data) throws Exception {
        String user = getString(data, "user");
        String pass = getString(data, "pass");

        ChatResponse response = new ChatResponse();
        response.setEvent("LOGIN");

        User existingUser = userRepository.findByUsername(user);

        // So sánh password qua BCrypt (không plain text)
        if (existingUser == null || !passwordEncoder.matches(pass, existingUser.getPassword())) {
            response.setStatus("error");
            response.setMes("Sai tài khoản hoặc mật khẩu");
        } else {
            String token = jwtService.generateToken(user);

            response.setStatus("success");
            response.setMes("Đăng nhập thành công");

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("RE_LOGIN_CODE", token); // JWT thay cho UUID ngẫu nhiên
            responseData.put("username", user);
            response.setData(responseData);

            sessionUsernames.put(session, user);
        }
        send(session, response);
    }

    /**
     * RE_LOGIN: frontend gửi token JWT (lưu ở localStorage), server xác thực token thay vì chỉ
     * nhận username. Payload mới: { token: "..." } thay vì { user: "..." }
     */
    private void handleRelogin(WebSocketSession session, JsonNode data) throws Exception {
        String token = getString(data, "token");

        ChatResponse response = new ChatResponse();
        response.setEvent("RE_LOGIN");

        String username = jwtService.validateAndGetUsername(token);
        User existingUser = (username != null) ? userRepository.findByUsername(username) : null;

        if (existingUser != null) {
            response.setStatus("success");

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("RE_LOGIN_CODE", token); // trả lại token cũ nếu còn hạn
            responseData.put("username", username);
            response.setData(responseData);

            sessionUsernames.put(session, username);
        } else {
            response.setStatus("error");
            response.setMes("Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
        }
        send(session, response);
    }

    // ─────────────────────────────────────────────
    // Chat handlers
    // ─────────────────────────────────────────────

    private void handleSendChat(WebSocketSession session, JsonNode data) throws Exception {
        String type     = getString(data, "type", "people");
        String to       = getString(data, "to");
        String mes      = getString(data, "mes");
        String fromUser = sessionUsernames.get(session);

        if (fromUser == null) {
            sendError(session, "SEND_CHAT", "Chưa đăng nhập");
            return;
        }

        // Lưu tin nhắn vào DB
        ChatMessage chatMsg = new ChatMessage();
        chatMsg.setType(type);
        chatMsg.setRecipient(to);
        chatMsg.setSender(fromUser);
        chatMsg.setContent(mes);
        chatMessageRepository.save(chatMsg);

        // Build response
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
            // Gửi cho người nhận + các tab khác của người gửi (tránh lặp trên tab hiện tại)
            for (Map.Entry<WebSocketSession, String> entry : sessionUsernames.entrySet()) {
                String username = entry.getValue();
                WebSocketSession s = entry.getKey();
                boolean isRecipient = username.equals(to);
                boolean isOtherTabOfSender = username.equals(fromUser) && !s.getId().equals(session.getId());
                if (s.isOpen() && (isRecipient || isOtherTabOfSender)) {
                    s.sendMessage(textMessage);
                }
            }
        } else {
            // Room: chỉ gửi cho thành viên trong room, không broadcast toàn bộ
            Set<WebSocketSession> members = roomMembers.getOrDefault(to, Collections.emptySet());
            for (WebSocketSession s : members) {
                if (s.isOpen() && !s.getId().equals(session.getId())) {
                    s.sendMessage(textMessage);
                }
            }
        }
    }

    private void handleGetPeopleChatMes(WebSocketSession session, JsonNode data) throws Exception {
        String to       = getStringMultiKey(data, "to", "name");
        String fromUser = sessionUsernames.get(session);

        List<ChatMessage> messages = chatMessageRepository.findConversation(fromUser, to);
        List<Map<String, Object>> chatData = buildMessageList(messages);

        ChatResponse response = new ChatResponse();
        response.setEvent("GET_PEOPLE_CHAT_MES");
        response.setStatus("success");
        response.setData(chatData);
        send(session, response);
    }

    private void handleGetRoomChatMes(WebSocketSession session, JsonNode data) throws Exception {
        String room = getStringMultiKey(data, "to", "name");

        List<ChatMessage> messages = chatMessageRepository.findRoomMessages(room);
        List<Map<String, Object>> chatData = buildMessageList(messages);

        ChatResponse response = new ChatResponse();
        response.setEvent("GET_ROOM_CHAT_MES");
        response.setStatus("success");
        response.setData(chatData);
        send(session, response);
    }

    // ─────────────────────────────────────────────
    // User / Room handlers
    // ─────────────────────────────────────────────

    private void handleCheckUserExist(WebSocketSession session, JsonNode data) throws Exception {
        String userToCheck = getStringMultiKey(data, "user", "username", "name");

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
        send(session, response);
    }

    private void handleCheckUserOnline(WebSocketSession session, JsonNode data) throws Exception {
        String userToCheck = getStringMultiKey(data, "user", "username", "name");

        boolean isOnline = sessionUsernames.containsValue(userToCheck);

        ChatResponse response = new ChatResponse();
        response.setEvent("CHECK_USER_ONLINE");
        response.setStatus("success");

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("status", isOnline);
        responseData.put("user", userToCheck);
        response.setData(responseData);
        send(session, response);
    }

    private void handleGetUserList(WebSocketSession session, JsonNode data) throws Exception {
        String currentUser = sessionUsernames.get(session);

        List<Map<String, Object>> userList = new ArrayList<>();

        if (currentUser != null) {
            List<User> interactedUsers = userRepository.findInteractedUsers(currentUser);
            for (User u : interactedUsers) {
                if (currentUser.equals(u.getUsername())) continue;
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("name", u.getUsername());
                userMap.put("type", 0); // 0 = người dùng cá nhân
                userList.add(userMap);
            }

            List<String> allRooms = chatMessageRepository.findAllActiveRooms();
            for (String room : allRooms) {
                Map<String, Object> roomMap = new HashMap<>();
                roomMap.put("name", room);
                roomMap.put("type", 1); // 1 = room
                userList.add(roomMap);
            }
        }

        ChatResponse response = new ChatResponse();
        response.setEvent("GET_USER_LIST");
        response.setStatus("success");
        response.setData(userList);
        send(session, response);
    }

    private void handleCreateRoom(WebSocketSession session, JsonNode data) throws Exception {
        String roomName   = getString(data, "name");
        String currentUser = sessionUsernames.get(session);

        if (currentUser == null) {
            sendError(session, "CREATE_ROOM", "Chưa đăng nhập");
            return;
        }

        // Lưu tin nhắn hệ thống để room tồn tại sau khi F5
        ChatMessage initMsg = new ChatMessage();
        initMsg.setType("room");
        initMsg.setRecipient(roomName);
        initMsg.setSender(currentUser);
        initMsg.setContent(currentUser + " đã tạo nhóm chat");
        chatMessageRepository.save(initMsg);

        // Người tạo room tự động join luôn
        roomMembers.computeIfAbsent(roomName, k -> ConcurrentHashMap.newKeySet()).add(session);

        ChatResponse response = new ChatResponse();
        response.setEvent("CREATE_ROOM");
        response.setStatus("success");

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("name", roomName);
        responseData.put("owner", currentUser);
        response.setData(responseData);

        // Broadcast cho tất cả để danh sách room được cập nhật
        TextMessage textMessage = new TextMessage(mapper.writeValueAsString(response));
        for (WebSocketSession s : activeSessions.values()) {
            if (s.isOpen()) s.sendMessage(textMessage);
        }
    }

    private void handleJoinRoom(WebSocketSession session, JsonNode data) throws Exception {
        String roomName = getString(data, "name");

        // Thêm session vào room — đây là nơi membership thực sự được ghi nhận
        roomMembers.computeIfAbsent(roomName, k -> ConcurrentHashMap.newKeySet()).add(session);

        ChatResponse response = new ChatResponse();
        response.setEvent("JOIN_ROOM");
        response.setStatus("success");

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("name", roomName);
        responseData.put("memberCount", roomMembers.get(roomName).size());
        response.setData(responseData);
        send(session, response);
    }

    // ─────────────────────────────────────────────
    // WebRTC handler
    // ─────────────────────────────────────────────

    private void handleWebRTCSignal(WebSocketSession session, JsonNode data) throws Exception {
        String to       = getString(data, "to");
        String fromUser = sessionUsernames.get(session);

        ChatResponse response = new ChatResponse();
        response.setEvent("WEBRTC_SIGNAL");
        response.setStatus("success");

        Map<String, Object> payload = new HashMap<>();
        payload.put("from", fromUser);
        payload.put("to", to);
        if (data.has("signalType")) payload.put("signalType", data.get("signalType").asText());
        if (data.has("sdp"))       payload.put("sdp", data.get("sdp"));
        if (data.has("candidate")) payload.put("candidate", data.get("candidate"));
        response.setData(payload);

        TextMessage textMessage = new TextMessage(mapper.writeValueAsString(response));
        for (Map.Entry<WebSocketSession, String> entry : sessionUsernames.entrySet()) {
            if (entry.getValue().equals(to) && entry.getKey().isOpen()) {
                entry.getKey().sendMessage(textMessage);
            }
        }
    }

    // ─────────────────────────────────────────────
    // Utilities
    // ─────────────────────────────────────────────

    /** Gửi ChatResponse dưới dạng JSON */
    private void send(WebSocketSession session, ChatResponse response) throws Exception {
        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
    }

    /** Gửi error response nhanh */
    private void sendError(WebSocketSession session, String event, String message) throws Exception {
        ChatResponse response = new ChatResponse();
        response.setEvent(event);
        response.setStatus("error");
        response.setMes(message);
        send(session, response);
    }

    /** Lấy string từ JsonNode theo 1 key, mặc định "" */
    private String getString(JsonNode node, String key) {
        return getString(node, key, "");
    }

    /** Lấy string từ JsonNode theo 1 key, với giá trị mặc định */
    private String getString(JsonNode node, String key, String defaultValue) {
        if (node == null || !node.has(key)) return defaultValue;
        return node.get(key).asText(defaultValue);
    }

    /** Thử nhiều key theo thứ tự, lấy key đầu tiên có giá trị */
    private String getStringMultiKey(JsonNode node, String... keys) {
        if (node == null) return "";
        for (String key : keys) {
            if (node.has(key)) return node.get(key).asText("");
        }
        return "";
    }

    /** Build danh sách tin nhắn để trả về frontend */
    private List<Map<String, Object>> buildMessageList(List<ChatMessage> messages) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (ChatMessage m : messages) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("name", m.getSender());
            map.put("to", m.getRecipient());
            map.put("mes", m.getContent());
            map.put("createAt", m.getCreatedAt());
            result.add(map);
        }
        return result;
    }
}