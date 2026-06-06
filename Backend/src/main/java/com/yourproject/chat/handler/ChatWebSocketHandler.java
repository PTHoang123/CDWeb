package com.yourproject.chat.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yourproject.chat.dto.ChatRequest;
import com.yourproject.chat.dto.ChatResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, WebSocketSession> activeSessions = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, String> sessionUsernames = new ConcurrentHashMap<>();

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
                    case "LOGIN":
                        handleLogin(session, data);
                        break;
                    case "SEND_CHAT":
                        handleSendChat(session, data);
                        break;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void handleLogin(WebSocketSession session, JsonNode data) throws Exception {
        String user = data.get("user").asText();
        ChatResponse response = new ChatResponse();
        response.setEvent("RE_LOGIN");
        response.setStatus("success");
        
        Map<String, String> responseData = new HashMap<>();
        responseData.put("RE_LOGIN_CODE", UUID.randomUUID().toString());
        response.setData(responseData);

        sessionUsernames.put(session, user);
        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
    }

    private void handleSendChat(WebSocketSession session, JsonNode data) throws Exception {
        String type = data.get("type").asText();
        String to = data.get("to").asText();
        String mes = data.get("mes").asText();
        String fromUser = sessionUsernames.get(session);

        ChatResponse response = new ChatResponse();
        response.setEvent("SEND_CHAT");
        response.setStatus("success");

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", type);
        payload.put("to", to);
        payload.put("from", fromUser);
        payload.put("mes", mes);
        response.setData(payload);

        TextMessage textMessage = new TextMessage(mapper.writeValueAsString(response));
        for (WebSocketSession s : activeSessions.values()) {
            if (s.isOpen()) s.sendMessage(textMessage);
        }
    }
}
