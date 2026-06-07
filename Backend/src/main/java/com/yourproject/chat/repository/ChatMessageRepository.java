package com.yourproject.chat.repository;

import com.yourproject.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    @Query("SELECT m FROM ChatMessage m WHERE m.type = 'people' AND ((m.sender = :user1 AND m.recipient = :user2) OR (m.sender = :user2 AND m.recipient = :user1)) ORDER BY m.id ASC")
    List<ChatMessage> findConversation(@Param("user1") String user1, @Param("user2") String user2);

    @Query("SELECT m FROM ChatMessage m WHERE m.type = 'room' AND m.recipient = :room ORDER BY m.id ASC")
    List<ChatMessage> findRoomMessages(@Param("room") String room);

    @Query("SELECT DISTINCT m.recipient FROM ChatMessage m WHERE m.type = 'room' AND m.sender = :username")
    List<String> findInteractedRooms(@Param("username") String username);

    @Query("SELECT DISTINCT m.recipient FROM ChatMessage m WHERE m.type = 'room'")
    List<String> findAllActiveRooms();
}