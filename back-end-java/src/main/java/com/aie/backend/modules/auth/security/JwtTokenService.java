package com.aie.backend.modules.auth.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.aie.backend.config.JwtProperties;
import com.aie.backend.modules.auth.dto.MenuItem;
import com.aie.backend.modules.auth.entities.Administrador;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;

@Component
public class JwtTokenService {

    private final JwtProperties properties;
    private final SecretKey key;

    public JwtTokenService(JwtProperties properties) {
        this.properties = properties;
        String secret = properties.getSecret();
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("JWT secret must be provided and contain at least 32 characters");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Administrador admin, List<MenuItem> menu) {
        Instant now = Instant.now();
        Instant expires = now.plus(properties.getAccessTokenExpiration());

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", admin.getId());
        payload.put("email", admin.getEmail());
        payload.put("name", admin.getName());
        payload.put("social_number", admin.getSocialNumber());
        payload.put("admin", true);
        payload.put("menu", menu);

        return Jwts.builder()
                .setSubject(String.valueOf(admin.getId()))
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expires))
                .addClaims(payload)
                .signWith(key)
                .compact();
    }

    public String generateToken(Map<String, Object> payload) {
        Instant now = Instant.now();
        Instant expires = now.plus(properties.getAccessTokenExpiration());
        String subject = payload.get("id") != null ? String.valueOf(payload.get("id")) : "user";
        return Jwts.builder()
                .setSubject(subject)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expires))
                .addClaims(payload)
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
