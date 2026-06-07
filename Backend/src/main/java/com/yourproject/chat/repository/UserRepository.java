package com.yourproject.chat.repository;

import com.yourproject.chat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);

    @Query("SELECT DISTINCT u FROM User u WHERE u.username IN (SELECT m.sender FROM ChatMessage m WHERE m.recipient = :username AND m.type = 'people') OR u.username IN (SELECT m.recipient FROM ChatMessage m WHERE m.sender = :username AND m.type = 'people')")
    List<User> findInteractedUsers(@Param("username") String username);
}
