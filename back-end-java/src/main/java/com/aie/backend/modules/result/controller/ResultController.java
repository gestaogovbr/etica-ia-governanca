package com.aie.backend.modules.result.controller;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aie.backend.config.ResponseError;
import com.aie.backend.modules.result.dto.UpsertResultRequest;
import com.aie.backend.modules.result.entities.Result;
import com.aie.backend.modules.result.service.ResultService;

import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;


@RestController
@RequestMapping("/results")
@Tag(name = "Results", description = "Results endpoints")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class ResultController {

    private final ResultService service;

    public ResultController(ResultService service) {
        this.service = service;
    }

    @Operation(summary = "Create or update a Result for a Response", responses = {
            @ApiResponse(responseCode = "200", description = "Result saved successfully"),
            @ApiResponse(responseCode = "404", description = "Response or Project not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class)))
    })
    @PostMapping
    public Result upsert(@Valid @RequestBody UpsertResultRequest request) {
        return service.upsert(request);
    }

    @Operation(summary = "Retrieve Result by Response ID", responses = {
            @ApiResponse(responseCode = "200", description = "Result retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Result not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class)))
    })
    @GetMapping("/{responseId}")
    public Result findByResponse(@PathVariable Long responseId) {
        return service.findByResponse(responseId);
    }
}
