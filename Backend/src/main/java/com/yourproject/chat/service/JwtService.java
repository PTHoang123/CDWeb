package com.yourproject.chat.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    /**
     * Inject secret và expiration từ application.properties:
     *   jwt.secret=your-very-long-secret-key-at-least-32-chars
     *   jwt.expiration-ms=86400000
     *
     * Nếu không cấu hình, fallback về giá trị mặc định.
     */
    public JwtService(
            @Value("${jwt.secret:changeme-please-use-a-real-secret-key-32c}") String secret,
            @Value("${jwt.expiration-ms:86400000}") long expirationMs
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /**
     * Tạo JWT token từ username.
     */
    public String generateToken(String username) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key)
                .compact();
    }

    /**
     * Xác thực token và trả về username.
     * Trả về null nếu token không hợp lệ hoặc đã hết hạn.
     */
    public String validateAndGetUsername(String token) {
        if (token == null || token.isBlank()) return null;

        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return claims.getSubject();
        } catch (ExpiredJwtException e) {
            System.out.println("[JWT] Token đã hết hạn: " + e.getMessage());
        } catch (UnsupportedJwtException e) {
            System.out.println("[JWT] Token không được hỗ trợ: " + e.getMessage());
        } catch (MalformedJwtException e) {
            System.out.println("[JWT] Token không đúng định dạng: " + e.getMessage());
        } catch (JwtException | IllegalArgumentException e) {
            System.out.println("[JWT] Token không hợp lệ: " + e.getMessage());
        }

        return null;
    }
}