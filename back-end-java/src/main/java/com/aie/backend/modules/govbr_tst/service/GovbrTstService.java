package com.aie.backend.modules.govbr_tst.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.aie.backend.modules.auth.dto.MenuItem;
import com.aie.backend.modules.auth.security.JwtTokenService;
import com.aie.backend.modules.govbr_tst.dto.GovbrLoginRequest;

@Service
public class GovbrTstService {

    private final JwtTokenService tokenService;

    public GovbrTstService(JwtTokenService tokenService) {
        this.tokenService = tokenService;
    }

    public Map<String, Object> login(GovbrLoginRequest request) {
        Map<String, Object> fakeUser = Map.of(
                "id", 2,
                "name", "Login GOVBR Educação",
                "email", "hudson.m.3110@gmail.com",
                "social_number", "701.694.781-57",
                "admin", Boolean.FALSE,
                "menu", List.of(
                        new MenuItem("fas fa-chart-bar", "home", "sidebar.home", 0, ""),
                        new MenuItem("fas fa-folder", "projects", "sidebar.projects", 1, "projects")
                ),
                "gov_token_received", request != null ? request.getToken() : null
        );

        String token = tokenService.generateToken(fakeUser);
        return Map.of("user", fakeUser, "token", token);
    }
}
