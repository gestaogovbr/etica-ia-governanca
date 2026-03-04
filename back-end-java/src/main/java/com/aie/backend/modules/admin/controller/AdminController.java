package com.aie.backend.modules.admin.controller;

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

import com.aie.backend.config.ResponseError;
import com.aie.backend.modules.admin.dto.AdminResponse;
import com.aie.backend.modules.admin.dto.CreateAdminRequest;
import com.aie.backend.modules.admin.dto.UpdateAdminRequest;
import com.aie.backend.modules.admin.service.AdminService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin")
@Tag(name = "Admin", description = "Admin management endpoints")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class AdminController {

    private final AdminService service;

    public AdminController(AdminService service) {
        this.service = service;
    }

    @Operation(summary = "Create a new Admin user", responses = {
            @ApiResponse(responseCode = "409", description = "Admin conflict error", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "201", description = "Admin created successfully")
    })
    @PostMapping
    public AdminResponse create(@Valid @RequestBody CreateAdminRequest request) {
        return service.create(request);
    }

    @Operation(summary = "Update an existing Admin user by ID", responses = {
            @ApiResponse(responseCode = "404", description = "Admin not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "409", description = "Admin conflict error", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "200", description = "Admin updated successfully")
    })
    @PutMapping("/{id}")
    public AdminResponse update(@PathVariable Long id, @Valid @RequestBody UpdateAdminRequest request) {
        return service.update(id, request);
    }

    @Operation(summary = "Get all Admin users")
    @GetMapping
    public List<AdminResponse> findAll() {
        return service.findAll();
    }

    @Operation(summary = "Get a specific Admin user by ID", responses = {
            @ApiResponse(responseCode = "404", description = "Admin not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "200", description = "Admin found successfully")
    })
    @GetMapping("/{id}")
    public AdminResponse findOne(@PathVariable Long id) {
        return service.findOne(id);
    }

    @Operation(summary = "Soft delete a specific Admin user by ID", responses = {
            @ApiResponse(responseCode = "404", description = "Admin not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "200", description = "Admin deleted successfully")
    })
    @DeleteMapping("/{id}")
    public AdminResponse softDelete(@PathVariable Long id) {
        return service.softDelete(id);
    }
}
