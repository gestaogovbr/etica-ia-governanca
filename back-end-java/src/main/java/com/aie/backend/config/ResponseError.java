package com.aie.backend.config;

import io.swagger.v3.oas.annotations.media.Schema;

public class ResponseError {
    @Schema(description = "Error type", example = "Error Type")
    public String error;
    
    @Schema(description = "Error message", example = "resource.errorType")
    public String message;
    
    @Schema(description = "HTTP status code")
    public Integer statuscode;
}
