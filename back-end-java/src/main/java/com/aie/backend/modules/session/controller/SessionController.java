package com.aie.backend.modules.session.controller;

import java.util.List;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.aie.backend.config.ResponseError;
import com.aie.backend.modules.auth.security.AuthenticatedAdmin;
import com.aie.backend.modules.session.dto.CreateSessionRequest;
import com.aie.backend.modules.session.dto.UpdateSessionRequest;
import com.aie.backend.modules.session.entities.Session;
import com.aie.backend.modules.session.service.SessionService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/sessions")
@Tag(name = "Sessions", description = "Sessions endpoints")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class SessionController {

    private final SessionService service;

    public SessionController(SessionService service) {
        this.service = service;
    }

    @Operation(summary = "Create a new Session", responses = {
            @ApiResponse(responseCode = "201", description = "Session created successfully"),
            @ApiResponse(responseCode = "409", description = "Session code unique constraint violation", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
    })
    @PostMapping
    public Session create(@Valid @RequestBody CreateSessionRequest request) {
        return service.create(request);
    }

    @Operation(summary = "Update an existing Session by ID", responses = {
            @ApiResponse(responseCode = "201", description = "Session created successfully"),
            @ApiResponse(responseCode = "409", description = "Session code unique constraint violation", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "404", description = "Session not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
    })
    @PutMapping("/{id}")
    public Session update(@PathVariable Long id, @Valid @RequestBody UpdateSessionRequest request) {
        return service.update(id, request);
    }

    @Operation(summary = "Retrieve all Sessions if admin, else only active Sessions")
    @GetMapping
    public List<Session> findAll(@AuthenticationPrincipal AuthenticatedAdmin admin) {
        boolean isAdmin = admin != null && admin.admin();
        return service.findAll(isAdmin);
    }

    @Operation(summary = "Retrieve a specific Session by ID", responses = {
            @ApiResponse(responseCode = "404", description = "Session not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "200", description = "Session retrieved successfully")
    })
    @GetMapping("/{id}")
    public Session findOne(@PathVariable Long id) {
        return service.findOne(id);
    }

    @Operation(summary = "Soft delete a specific Session by ID", responses = {
            @ApiResponse(responseCode = "404", description = "Session not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "200", description = "Session deleted successfully")
    })
    @DeleteMapping("/{id}")
    public Session softDelete(@PathVariable Long id) {
        return service.softDelete(id);
    }
}
