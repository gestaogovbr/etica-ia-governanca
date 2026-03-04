package com.aie.backend.modules.project.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
import com.aie.backend.modules.actor.entities.DeleteResponse;
import com.aie.backend.modules.auth.security.AuthenticatedAdmin;
import com.aie.backend.modules.project.dto.CreateProjectRequest;
import com.aie.backend.modules.project.dto.ProjectShareRequest;
import com.aie.backend.modules.project.dto.UpdateProjectRequest;
import com.aie.backend.modules.project.entities.Project;
import com.aie.backend.modules.project.entities.ProjectDeleteResponse;
import com.aie.backend.modules.project.entities.ProjectShare;
import com.aie.backend.modules.project.service.ProjectService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/projects")
@Tag(name = "Project", description = "Project management endpoints")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class ProjectController {

    private final ProjectService service;

    public ProjectController(ProjectService service) {
        this.service = service;
    }

    @Operation(summary = "Create a new Project", responses = {
            @ApiResponse(responseCode = "201", description = "Project created successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden Action", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
    })
    @PostMapping
    public Project create(@Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal AuthenticatedAdmin user) {
        return service.create(request, user);
    }

    @Operation(summary = "Retrieve all Projects for the authenticated user")
    @GetMapping
    public List<Project> findAll(@AuthenticationPrincipal AuthenticatedAdmin user) {
        return service.findAll(user);
    }

    @Operation(summary = "Retrieve an existing Project by ID", responses = {
            @ApiResponse(responseCode = "200", description = "Project retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden Action", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "404", description = "Project not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
    })
    @GetMapping("/{id}")
    public Project findOne(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedAdmin user) {
        return service.findOne(id, user);
    }

    @Operation(summary = "Update an existing Project by ID", responses = {
            @ApiResponse(responseCode = "200", description = "Project updated successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden Action", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "404", description = "Project not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
    })
    @PutMapping("/{id}")
    public Project update(@PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request,
            @AuthenticationPrincipal AuthenticatedAdmin user) {
        return service.update(id, request, user);
    }

    @Operation(summary = "Delete an existing Project by ID", responses = {
            @ApiResponse(responseCode = "200", description = "Project deleted successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProjectDeleteResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden Action", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "404", description = "Project not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
    })
    @DeleteMapping("/{id}")
    public Map<String, Boolean> remove(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedAdmin user) {
        return service.remove(id, user);
    }

    @Operation(summary = "Get the shares from an existing Project by ID", responses = {
            @ApiResponse(responseCode = "200", description = "Project updated successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden Action", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "404", description = "Project not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
    })
    @GetMapping("/{id}/shares")
    public List<ProjectShare> listShares(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedAdmin user) {
        return service.listShares(id, user);
    }

    @Operation(summary = "Creates a new share for an existing Project by ID", responses = {
            @ApiResponse(responseCode = "200", description = "Project updated successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden Action", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "404", description = "Project not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
    })
    @PostMapping("/{id}/shares")
    public ProjectShare addShare(@PathVariable Long id,
            @Valid @RequestBody ProjectShareRequest request,
            @AuthenticationPrincipal AuthenticatedAdmin user) {
        return service.addShare(id, request, user);
    }

    @Operation(summary = "Delete an share from an existing Project by ID", responses = {
            @ApiResponse(responseCode = "200", description = "Project deleted successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = DeleteResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden Action", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "404", description = "Project not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
    })
    @DeleteMapping("/{id}/shares/{shareId}")
    public Map<String, Boolean> removeShare(@PathVariable Long id,
            @PathVariable Long shareId,
            @AuthenticationPrincipal AuthenticatedAdmin user) {
        return service.removeShare(id, shareId, user);
    }
}
