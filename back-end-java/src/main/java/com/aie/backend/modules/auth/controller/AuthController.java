package com.aie.backend.modules.auth.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aie.backend.config.ResponseError;
import com.aie.backend.modules.auth.dto.AuthResponse;
import com.aie.backend.modules.auth.dto.LoginRequest;
import com.aie.backend.modules.auth.security.AuthenticatedAdmin;
import com.aie.backend.modules.auth.service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@Tag(name = "Auth", description = "Authentication endpoints")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "User login with email and password", responses = {
            @ApiResponse(description = "Successful login", responseCode = "201")
    })
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return authService.login(request, httpRequest);
    }

    @Operation(summary = "Get the profile of the logged in user", responses = {
            @ApiResponse(description = "Successful retrieval of user profile", responseCode = "200", content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthenticatedAdmin.class))),
    }, security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/login")
    public AuthenticatedAdmin me(@AuthenticationPrincipal AuthenticatedAdmin admin) {
        return admin;
    }
}
