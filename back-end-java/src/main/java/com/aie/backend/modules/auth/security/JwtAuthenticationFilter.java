package com.aie.backend.modules.auth.security;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.Nullable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.aie.backend.modules.admin.repository.AdminRepository;
import com.aie.backend.modules.auth.dto.MenuItem;
import com.aie.backend.modules.auth.entities.Administrador;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger LOGGER = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenService tokenService;
    private final AdminRepository repository;

    public JwtAuthenticationFilter(JwtTokenService tokenService, AdminRepository repository) {
        this.tokenService = tokenService;
        this.repository = repository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = tokenService.parse(token);
                Long id = toLong(claims.get("id"));
                if (id != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    repository.findById(id)
                            .filter(admin -> Boolean.TRUE.equals(admin.getActive()))
                            .ifPresent(admin -> authenticate(request, claims, token, admin));
                } else {
                    LOGGER.warn("[AUTH] Token parse ok mas id é nulo ou já autenticado. path={}", request.getRequestURI());
                }
            } catch (JwtException | IllegalArgumentException ignored) {
                LOGGER.warn("[AUTH] Token inválido ou parsing falhou. path={} authHeader={}", request.getRequestURI(), header);
            }
        } else {
            LOGGER.debug("[AUTH] Sem Authorization Bearer. path={}", request.getRequestURI());
        }
        filterChain.doFilter(request, response);
    }

    private void authenticate(HttpServletRequest request, Claims claims, String token, Administrador admin) {
        List<MenuItem> menu = extractMenu(claims.get("menu"));
        AuthenticatedAdmin principal = new AuthenticatedAdmin(
                admin.getId(),
                admin.getName(),
                admin.getEmail(),
                admin.getSocialNumber(),
                true,
                menu
        );
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal,
                token,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        LOGGER.info("[AUTH] Autenticado adminId={} path={}", admin.getId(), request.getRequestURI());
    }

    @SuppressWarnings("unchecked")
    private List<MenuItem> extractMenu(@Nullable Object claim) {
        if (claim == null) {
            return List.of();
        }
        if (claim instanceof List<?> list) {
            List<MenuItem> menu = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    String icon = getAsString(map, "icon");
                    String id = getAsString(map, "id");
                    String name = getAsString(map, "name");
                    int order = getAsNumber(map, "order");
                    String path = getAsString(map, "path");
                    menu.add(new MenuItem(icon, id, name, order, path));
                }
            }
            return menu;
        }
        return List.of();
    }

    private String getAsString(Map<?, ?> map, String key) {
        Object value = map.get(key);
        return value instanceof String str ? str : "";
    }

    private int getAsNumber(Map<?, ?> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number number) {
            return number.intValue();
        }
        return 0;
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String str) {
            try {
                return Long.parseLong(str);
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }
}
