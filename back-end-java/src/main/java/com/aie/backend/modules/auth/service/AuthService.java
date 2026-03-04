package com.aie.backend.modules.auth.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.aie.backend.modules.admin.dto.AdminResponse;
import com.aie.backend.modules.admin.repository.AdminRepository;
import com.aie.backend.modules.auth.dto.AuthResponse;
import com.aie.backend.modules.auth.dto.LoginRequest;
import com.aie.backend.modules.auth.dto.MenuItem;
import com.aie.backend.modules.auth.entities.Administrador;
import com.aie.backend.modules.auth.security.JwtTokenService;
import com.aie.backend.modules.logs.service.LogEvent;
import com.aie.backend.modules.logs.service.LogsService;

import jakarta.servlet.http.HttpServletRequest;

@Service
@Transactional
public class AuthService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthService.class);

    private final AdminRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService tokenService;
    private final LogsService logsService;

    public AuthService(AdminRepository repository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenService tokenService,
                       LogsService logsService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.logsService = logsService;
    }

    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String email = request.getEmail().trim().toLowerCase();
        String ip = resolveIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        LOGGER.info("[AUTH] Attempt email={} ip={}", email, ip);
        try {
            Administrador admin = repository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> unauthorized("login.invalid"));

            LOGGER.debug("[AUTH] Found admin id={} active={}", admin.getId(), admin.getActive());
            if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
                LOGGER.warn("[AUTH] Invalid password email={}", email);
                throw unauthorized("login.invalid");
            }

            if (!Boolean.TRUE.equals(admin.getActive())) {
                LOGGER.warn("[AUTH] Inactive admin email={}", email);
                throw unauthorized("login.inative");
            }

            admin.setLastAccess(Instant.now());
            Administrador updated = repository.save(admin);
            LOGGER.info("[AUTH] Login success email={} id={}", email, updated.getId());

            List<MenuItem> menu = adminMenu();
            String token = tokenService.generateToken(updated, menu);

            logsService.write(new LogEvent(
                    updated.getId(),
                    updated.getEmail(),
                    ip,
                    "login",
                    "auth",
                    "/auth/login",
                    "POST",
                    "SUCCESS",
                    Map.of("email", email),
                    userAgent,
                    null
            ));

            return new AuthResponse(AdminResponse.fromEntity(updated), token, menu);
        } catch (ResponseStatusException ex) {
            String error = ex.getReason() != null ? ex.getReason() : ex.getStatusCode().toString();
            logFailure(email, ip, userAgent, error);
            logsService.write(new LogEvent(
                    null,
                    email,
                    ip,
                    "login",
                    "auth",
                    "/auth/login",
                    "POST",
                    "ERROR",
                    Map.of("email", email, "error", error),
                    userAgent,
                    null
            ));
            throw ex;
        } catch (RuntimeException ex) {
            String error = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
            logFailure(email, ip, userAgent, error);
            logsService.write(new LogEvent(
                    null,
                    email,
                    ip,
                    "login",
                    "auth",
                    "/auth/login",
                    "POST",
                    "ERROR",
                    Map.of("email", email, "error", error),
                    userAgent,
                    null
            ));
            throw ex;
        }
    }

    private List<MenuItem> adminMenu() {
        return List.of(
                new MenuItem("fas fa-chart-bar", "home", "sidebar.home", 0, ""),
                new MenuItem("fas fa-folder", "projects", "sidebar.projects_received", 1, "projects-received"),
                new MenuItem("fas fa-folder", "my_projects", "sidebar.projects", 2, "projects"),
                new MenuItem("fas fa-clipboard-check", "questions", "sidebar.questions", 3, "questions"),
                new MenuItem("fas fa-users", "actors", "sidebar.actors", 4, "actors"),
                new MenuItem("fas fa-clipboard-list", "sessions", "sidebar.sessions", 5, "sessions"),
                new MenuItem("fas fa-newspaper", "logs", "sidebar.logs", 6, "logs"),
                new MenuItem("fas fa-users", "users", "sidebar.users", 7, "admins"),
                new MenuItem("fas fa-cog", "config", "sidebar.config", 8, "config-classifications")
        );
    }

    private ResponseStatusException unauthorized(String message) {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, message);
    }

    private void logFailure(String email, String ip, String userAgent, String reason) {
        LOGGER.warn("[AUTH] Login failure email={} ip={} userAgent={} reason={}", email, ip, userAgent, reason);
    }

    private String resolveIp(HttpServletRequest request) {
        String forwarded = request.getHeader("x-forwarded-for");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
