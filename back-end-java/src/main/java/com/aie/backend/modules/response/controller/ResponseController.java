package com.aie.backend.modules.response.controller;

import java.util.List;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aie.backend.config.ResponseError;
import com.aie.backend.modules.response.dto.CreateResponseRequest;
import com.aie.backend.modules.response.dto.ResponseFilters;
import com.aie.backend.modules.response.entities.Response;
import com.aie.backend.modules.response.service.ResponseService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/responses")
@Tag(name = "Responses", description = "Responses endpoints")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class ResponseController {

    private final ResponseService service;

    public ResponseController(ResponseService service) {
        this.service = service;
    }

    @Operation(summary = "Create a new Response", responses = {
            @ApiResponse(responseCode = "404", description = "Project or Question Not Found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "400", description = "Answers Required Bad Request", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "201", description = "Response created successfully")
    })
    @PostMapping
    public Response create(@Valid @RequestBody CreateResponseRequest request) {
        return service.create(request);
    }

    @Operation(summary = "Retrieve all Responses with optional filtering")
    @GetMapping
    public List<Response> findAll(@RequestParam(value = "projectId", required = false) Long projectId,
            @RequestParam(value = "status", required = false) String status) {
        ResponseFilters filters = new ResponseFilters();
        filters.setProjectId(projectId);
        filters.setStatus(status);
        return service.findAll(filters);
    }

    @Operation(summary = "Retrieve a specific Response by ID", responses = {
            @ApiResponse(responseCode = "404", description = "Response not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseError.class))),
            @ApiResponse(responseCode = "200", description = "Response retrieved successfully")
    })
    @GetMapping("/{id}")
    public Response findOne(@PathVariable Long id) {
        return service.findOne(id);
    }
}
