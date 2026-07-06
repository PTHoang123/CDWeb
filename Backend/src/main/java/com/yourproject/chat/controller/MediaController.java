package com.yourproject.chat.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/chat/media")
@CrossOrigin(origins = "*")
public class MediaController {

    // Thư mục lưu file tạm thời trên ổ đĩa server
    private final String UPLOAD_DIR = "uploads/voice/";

    @PostMapping("/upload-voice")
    public ResponseEntity<Map<String, String>> uploadVoice(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File rỗng"));
            }

            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) dir.mkdirs();

            // Tạo tên file ngẫu nhiên để không bị ghi đè
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(UPLOAD_DIR + fileName);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Trả về URL để Client gọi lấy file
            String fileUrl = "/uploads/voice/" + fileName;
            return ResponseEntity.ok(Map.of("url", fileUrl));

        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi lưu file: " + e.getMessage()));
        }
    }
}