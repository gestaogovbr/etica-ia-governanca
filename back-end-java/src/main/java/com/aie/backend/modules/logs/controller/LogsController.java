package com.aie.backend.modules.logs.controller;

import java.util.List;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RestController;

import com.aie.backend.modules.logs.dto.LogsQuery;
import com.aie.backend.modules.logs.entities.LogEntry;
import com.aie.backend.modules.logs.service.LogsService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/logs")
@Tag(name = "Logs", description = "System Logs endpoint")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class LogsController {

    private final LogsService service;

    public LogsController(LogsService service) {
        this.service = service;
    }

    @Operation(summary = "List system logs with optional filtering")
    @GetMapping
    public List<LogEntry> list(@Valid @ModelAttribute LogsQuery query) {
        return service.search(query);
    }
}
