package com.aie.backend.modules.classificationlevel.controller;

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
import com.aie.backend.modules.classificationlevel.dto.CreateClassificationLevelRequest;
import com.aie.backend.modules.classificationlevel.dto.UpdateClassificationLevelRequest;
import com.aie.backend.modules.classificationlevel.entities.ClassificationLevel;
import com.aie.backend.modules.classificationlevel.service.ClassificationLevelService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/classification-levels")
@Tag(name = "Classification Level", description = "Project Classification Level management endpoints")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class ClassificationLevelController {

    private final ClassificationLevelService service;

    public ClassificationLevelController(ClassificationLevelService service) {
        this.service = service;
    }

    @Operation(summary = "Get all Classification Levels")
    @GetMapping
    public List<ClassificationLevel> findAll() {
        return service.findAll();
    }

    @Operation(summary = "Create a new Classification Level")
    @PostMapping
    public ClassificationLevel create(@Valid @RequestBody CreateClassificationLevelRequest request) {
        return service.create(request);
    }

    @Operation(summary = "Update an existing Classification Level by ID", responses = {
        @ApiResponse(responseCode = "404", description = "Classification Level not found",  content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
        @ApiResponse(responseCode = "400", description = "Bad Request for Classification Level update", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
        @ApiResponse(responseCode = "200", description = "Classification Level updated successfully")
    })
    @PutMapping("/{id}")
    public ClassificationLevel update(@PathVariable Long id, @Valid @RequestBody UpdateClassificationLevelRequest request) {
        return service.update(id, request);
    }

    @Operation(summary = "Delete a specific Classification Level by ID", responses = {
        @ApiResponse(responseCode = "404", description = "Classification Level not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
        @ApiResponse(responseCode = "200", description = "Classification Level deleted successfully")
    })
    @DeleteMapping("/{id}")
    public void remove(@PathVariable Long id) {
        service.remove(id);
    }
}
