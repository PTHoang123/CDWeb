package com.yourproject.chat.repository;

import com.yourproject.chat.entity.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {

    /** Lấy tất cả room mà một user đã tham gia */
    @Query("SELECT r.roomName FROM RoomMember r WHERE r.username = :username")
    List<String> findRoomsByUsername(@Param("username") String username);

    /** Kiểm tra user đã là thành viên của room chưa */
    boolean existsByRoomNameAndUsername(String roomName, String username);

    /** Lấy danh sách username trong một room */
    @Query("SELECT r.username FROM RoomMember r WHERE r.roomName = :roomName")
    List<String> findUsernamesByRoomName(@Param("roomName") String roomName);
}