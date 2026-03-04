package com.aie.backend.modules.question.controller;

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
import com.aie.backend.modules.question.dto.CreateQuestionRequest;
import com.aie.backend.modules.question.dto.UpdateQuestionRequest;
import com.aie.backend.modules.question.entities.Question;
import com.aie.backend.modules.question.entities.QuestionVersion;
import com.aie.backend.modules.question.service.QuestionService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/questions")
@Tag(name = "Questions", description = "Questions management endpoints")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class QuestionController {

    private final QuestionService service;

    public QuestionController(QuestionService service) {
        this.service = service;
    }

    @Operation(summary = "Create a new Question", responses = {
        @ApiResponse(responseCode = "404", description = "Session Not Found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
        @ApiResponse(responseCode = "201", description = "Question created successfully")
    })
    @PostMapping
    public Question create(@Valid @RequestBody CreateQuestionRequest request) {
        return service.create(request);
    }

    @Operation(summary = "Update an existing Question by ID", responses = {
        @ApiResponse(responseCode = "404", description = "Question not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
        @ApiResponse(responseCode = "200", description = "Question updated successfully")
    })
    @PutMapping("/{id}")
    public Question update(@PathVariable Long id, @Valid @RequestBody UpdateQuestionRequest request) {
        return service.update(id, request);
    }

    @Operation(summary = "Update an existing Question by ID with versioning", responses = {
        @ApiResponse(responseCode = "404", description = "Question not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
        @ApiResponse(responseCode = "200", description = "Question updated successfully")
    })
    @PutMapping("/{id}/version")
    public Question updateWithVersion(@PathVariable Long id, @Valid @RequestBody UpdateQuestionRequest request) {
        return service.updateWithVersioning(id, request);
    }

    @Operation(summary = "Retrieve all Questions")
    @GetMapping
    public List<Question> findAll() {
        return service.findAll();
    }

    @Operation(summary = "Retrieve an existing Question by ID", responses = {
        @ApiResponse(responseCode = "404", description = "Question not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
        @ApiResponse(responseCode = "200", description = "Question retrieved successfully")
    })
    @GetMapping("/{id}")
    public Question findOne(@PathVariable Long id) {
        return service.findOne(id);
    }

    @Operation(summary = "List all versions of a specific Question by ID", responses = {
        @ApiResponse(responseCode = "404", description = "Question not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
        @ApiResponse(responseCode = "200", description = "Question versions retrieved successfully")
    })
    @GetMapping("/{id}/versions")
    public List<QuestionVersion> listVersions(@PathVariable Long id) {
        return service.listVersions(id);
    }

    @Operation(summary = "Soft delete a specific Question by ID", responses = {
        @ApiResponse(responseCode = "404", description = "Question not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
        @ApiResponse(responseCode = "200", description = "Question deleted successfully")
    })
    @DeleteMapping("/{id}")
    public Question softDelete(@PathVariable Long id) {
        return service.softDelete(id);
    }
}
