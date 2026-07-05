package com.yourproject.chat.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yourproject.chat.dto.ChatRequest;
import com.yourproject.chat.dto.ChatResponse;
import com.yourproject.chat.entity.ChatMessage;
import com.yourproject.chat.entity.RoomMember;
import com.yourproject.chat.entity.User;
import com.yourproject.chat.repository.ChatMessageRepository;
import com.yourproject.chat.repository.RoomMemberRepository;
import com.yourproject.chat.repository.UserRepository;
import com.yourproject.chat.security.JwtService;
import com.yourproject.chat.security.Role;
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

    // roomName → Set<Session> (in-memory, phục hồi lại sau RE_LOGIN)
    private final Map<String, Set<WebSocketSession>> roomMembers = new ConcurrentHashMap<>();

    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final JwtService jwtService;

    public ChatWebSocketHandler(
            UserRepository userRepository,
            ChatMessageRepository chatMessageRepository,
            RoomMemberRepository roomMemberRepository,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.roomMemberRepository = roomMemberRepository;
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
                case "REGISTER":            handleRegister(session, data);          break;
                case "LOGIN":               handleLogin(session, data);             break;
                case "RE_LOGIN":            handleRelogin(session, data);           break;
                case "SEND_CHAT":           handleSendChat(session, data);          break;
                case "CHECK_USER_EXIST":    handleCheckUserExist(session, data);    break;
                case "CHECK_USER_ONLINE":   handleCheckUserOnline(session, data);   break;
                case "GET_USER_LIST":       handleGetUserList(session, data);       break;
                case "GET_PEOPLE_CHAT_MES": handleGetPeopleChatMes(session, data);  break;
                case "GET_ROOM_CHAT_MES":   handleGetRoomChatMes(session, data);    break;
                case "CREATE_ROOM":         handleCreateRoom(session, data);        break;
                case "JOIN_ROOM":           handleJoinRoom(session, data);          break;
                case "WEBRTC_SIGNAL":       handleWebRTCSignal(session, data);      break;
                default:
                    sendError(session, "ERROR", "Sự kiện không được hỗ trợ: " + event);
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

        if (user == null || user.isEmpty() || pass == null || pass.isEmpty()) {
            response.setStatus("error");
            response.setMes("Tài khoản và mật khẩu không được để trống");
        } else if (userRepository.findByUsername(user).isPresent()) {
            response.setStatus("error");
            response.setMes("Tài khoản đã tồn tại!");
        } else {
            User newUser = new User();
            newUser.setUsername(user);
            newUser.setEmail(user + "@chat.local");
            newUser.setPassword(passwordEncoder.encode(pass));
            newUser.setRole(Role.USER);
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

        Optional<User> userOptional = userRepository.findByUsername(user);
        User existingUser = userOptional.orElse(null);

        if (existingUser == null || !passwordEncoder.matches(pass, existingUser.getPassword())) {
            response.setStatus("error");
            response.setMes("Sai tài khoản hoặc mật khẩu");
        } else {
            String token = jwtService.generateToken(existingUser);
            response.setStatus("success");
            response.setMes("Đăng nhập thành công");

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("RE_LOGIN_CODE", token);
            responseData.put("username", user);
            response.setData(responseData);

            sessionUsernames.put(session, user);
            restoreRoomSessions(session, user);
        }
        send(session, response);
    }

    private void handleRelogin(WebSocketSession session, JsonNode data) throws Exception {
        String token = getString(data, "token");

        ChatResponse response = new ChatResponse();
        response.setEvent("RE_LOGIN");

        String username = jwtService.extractUsername(token);
        User existingUser = (username != null) ? userRepository.findByUsername(username).orElse(null) : null;

        if (existingUser != null) {
            response.setStatus("success");

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("RE_LOGIN_CODE", token);
            responseData.put("username", username);
            response.setData(responseData);

            sessionUsernames.put(session, username);
            restoreRoomSessions(session, username);
        } else {
            response.setStatus("error");
            response.setMes("Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
        }
        send(session, response);
    }

    /**
     * Sau khi login/relogin, khôi phục lại in-memory roomMembers từ DB
     * để SEND_CHAT hoạt động đúng ngay mà không cần JOIN_ROOM lại.
     */
    private void restoreRoomSessions(WebSocketSession session, String username) {
        List<String> myRooms = roomMemberRepository.findRoomsByUsername(username);
        for (String roomName : myRooms) {
            roomMembers.computeIfAbsent(roomName, k -> ConcurrentHashMap.newKeySet()).add(session);
        }
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

        // Kiểm tra quyền gửi vào room
        if ("room".equals(type) && !roomMemberRepository.existsByRoomNameAndUsername(to, fromUser)) {
            sendError(session, "SEND_CHAT", "Bạn chưa tham gia room này");
            return;
        }

        ChatMessage chatMsg = new ChatMessage();
        chatMsg.setType(type);
        chatMsg.setRecipient(to);
        chatMsg.setSender(fromUser);
        chatMsg.setContent(mes);
        chatMessageRepository.save(chatMsg);

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
            // Chỉ gửi cho session đang online trong room này
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

        ChatResponse response = new ChatResponse();
        response.setEvent("GET_PEOPLE_CHAT_MES");
        response.setStatus("success");
        response.setData(buildMessageList(messages));
        send(session, response);
    }

    private void handleGetRoomChatMes(WebSocketSession session, JsonNode data) throws Exception {
        String room     = getStringMultiKey(data, "to", "name");
        String fromUser = sessionUsernames.get(session);

        // Chỉ cho lấy lịch sử nếu là thành viên
        if (!roomMemberRepository.existsByRoomNameAndUsername(room, fromUser)) {
            sendError(session, "GET_ROOM_CHAT_MES", "Bạn chưa tham gia room này");
            return;
        }

        List<ChatMessage> messages = chatMessageRepository.findRoomMessages(room);

        ChatResponse response = new ChatResponse();
        response.setEvent("GET_ROOM_CHAT_MES");
        response.setStatus("success");
        response.setData(buildMessageList(messages));
        send(session, response);
    }

    // ─────────────────────────────────────────────
    // User / Room handlers
    // ─────────────────────────────────────────────

    private void handleCheckUserExist(WebSocketSession session, JsonNode data) throws Exception {
        String userToCheck = getStringMultiKey(data, "user", "username", "name");
        Optional<User> existingUserOptional = userRepository.findByUsername(userToCheck);

        ChatResponse response = new ChatResponse();
        response.setEvent("CHECK_USER_EXIST");

        Map<String, Object> responseData = new HashMap<>();
        if (existingUserOptional.isPresent()) {
            User existingUser = existingUserOptional.get();
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

    /**
     * GET_USER_LIST: chỉ trả về room mà user đã join (private).
     */
    private void handleGetUserList(WebSocketSession session, JsonNode data) throws Exception {
        String currentUser = sessionUsernames.get(session);
        List<Map<String, Object>> userList = new ArrayList<>();

        if (currentUser != null) {
            // Danh sách người đã từng chat 1-1
            List<User> interactedUsers = userRepository.findInteractedUsers(currentUser);
            for (User u : interactedUsers) {
                if (currentUser.equals(u.getUsername())) continue;
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("name", u.getUsername());
                userMap.put("type", 0); // 0 = người dùng cá nhân
                userList.add(userMap);
            }

            // Chỉ lấy room mà user đã join
            List<String> myRooms = roomMemberRepository.findRoomsByUsername(currentUser);
            for (String room : myRooms) {
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
        String roomName    = getString(data, "name");
        String currentUser = sessionUsernames.get(session);

        if (currentUser == null) {
            sendError(session, "CREATE_ROOM", "Chưa đăng nhập");
            return;
        }

        if (roomMemberRepository.existsByRoomNameAndUsername(roomName, currentUser)) {
            sendError(session, "CREATE_ROOM", "Bạn đã tạo hoặc tham gia room này rồi");
            return;
        }

        // Lưu tin nhắn hệ thống để room tồn tại trong DB
        ChatMessage initMsg = new ChatMessage();
        initMsg.setType("room");
        initMsg.setRecipient(roomName);
        initMsg.setSender(currentUser);
        initMsg.setContent(currentUser + " đã tạo nhóm chat");
        chatMessageRepository.save(initMsg);

        // Người tạo tự động join room: lưu DB + in-memory
        roomMemberRepository.save(new RoomMember(roomName, currentUser));
        roomMembers.computeIfAbsent(roomName, k -> ConcurrentHashMap.newKeySet()).add(session);

        ChatResponse response = new ChatResponse();
        response.setEvent("CREATE_ROOM");
        response.setStatus("success");

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("name", roomName);
        responseData.put("owner", currentUser);
        response.setData(responseData);

        // Chỉ gửi lại cho người tạo (room private, người khác không thấy)
        send(session, response);
    }

    private void handleJoinRoom(WebSocketSession session, JsonNode data) throws Exception {
        String roomName    = getString(data, "name");
        String currentUser = sessionUsernames.get(session);

        if (currentUser == null) {
            sendError(session, "JOIN_ROOM", "Chưa đăng nhập");
            return;
        }

        ChatResponse response = new ChatResponse();
        response.setEvent("JOIN_ROOM");

        // Kiểm tra room có tồn tại không
        boolean roomExists = !chatMessageRepository.findRoomMessages(roomName).isEmpty();
        if (!roomExists) {
            response.setStatus("error");
            response.setMes("Room không tồn tại");
            send(session, response);
            return;
        }

        // Nếu chưa là thành viên → lưu vào DB
        if (!roomMemberRepository.existsByRoomNameAndUsername(roomName, currentUser)) {
            roomMemberRepository.save(new RoomMember(roomName, currentUser));
        }

        // Thêm vào in-memory
        roomMembers.computeIfAbsent(roomName, k -> ConcurrentHashMap.newKeySet()).add(session);

        response.setStatus("success");
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("name", roomName);
        responseData.put("memberCount", roomMemberRepository.findUsernamesByRoomName(roomName).size());
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
        if (data.has("sdp"))        payload.put("sdp", data.get("sdp"));
        if (data.has("candidate"))  payload.put("candidate", data.get("candidate"));
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

    private void send(WebSocketSession session, ChatResponse response) throws Exception {
        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
    }

    private void sendError(WebSocketSession session, String event, String message) throws Exception {
        ChatResponse response = new ChatResponse();
        response.setEvent(event);
        response.setStatus("error");
        response.setMes(message);
        send(session, response);
    }

    private String getString(JsonNode node, String key) {
        return getString(node, key, "");
    }

    private String getString(JsonNode node, String key, String defaultValue) {
        if (node == null || !node.has(key)) return defaultValue;
        return node.get(key).asText(defaultValue);
    }

    private String getStringMultiKey(JsonNode node, String... keys) {
        if (node == null) return "";
        for (String key : keys) {
            if (node.has(key)) return node.get(key).asText("");
        }
        return "";
    }

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