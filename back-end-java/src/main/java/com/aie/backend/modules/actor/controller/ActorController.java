package com.aie.backend.modules.actor.controller;

import java.util.List;
import java.util.Map;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aie.backend.modules.actor.dto.ActorResponse;
import com.aie.backend.modules.actor.dto.CreateActorRequest;
import com.aie.backend.modules.actor.dto.UpdateActorRequest;
import com.aie.backend.modules.actor.entities.DeleteResponse;
import com.aie.backend.modules.actor.service.ActorService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import com.aie.backend.config.ResponseError;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/actors")
@Tag(name = "Actor", description = "Question Actors endpoints")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class ActorController {

    private final ActorService service;

    public ActorController(ActorService service) {
        this.service = service;
    }

    @Operation(summary = "Create a new Actor")
    @PostMapping
    public ActorResponse create(@Valid @RequestBody CreateActorRequest request) {
        return service.create(request);
    }

    @Operation(summary = "Get all Actors with optional filtering by active status")
    @GetMapping
    public List<ActorResponse> findAll(@RequestParam(value = "active", required = false) String active) {
        return service.findAll(active);
    }

    @Operation(summary = "Get a specific Actor by ID", responses = {
            @ApiResponse(responseCode = "404", description = "Actor not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "200", description = "Actor found successfully")
    })
    @GetMapping("/{id}")
    public ActorResponse findOne(@PathVariable Long id) {
        return service.findOne(id);
    }

    @Operation(summary = "Update a specific Actor by ID", responses = {
            @ApiResponse(responseCode = "404", description = "Actor not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "200", description = "Actor updated successfully")
    })
    @PutMapping("/{id}")
    public ActorResponse update(@PathVariable Long id, @Valid @RequestBody UpdateActorRequest request) {
        return service.update(id, request);
    }

    @Operation(summary = "Delete a specific Actor by ID")
    @ApiResponse(responseCode = "404", description = "Actor not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class)))
    @ApiResponse(responseCode = "200", description = "Actor deleted successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = DeleteResponse.class)))
    @DeleteMapping("/{id}")
    public Map<String, Boolean> remove(@PathVariable Long id) {
        return service.remove(id);
    }
}
