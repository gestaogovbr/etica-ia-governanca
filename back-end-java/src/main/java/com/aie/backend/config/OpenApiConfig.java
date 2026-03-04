package com.aie.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerMethod;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        Schema<?> responseErrorSchema = new Schema<>()
                .type("object")
                .addProperty("status", new Schema<>().type("integer"))
                .addProperty("error", new Schema<>().type("string"))
                .addProperty("message", new Schema<>().type("string"));

        OpenAPI openAPI = new OpenAPI()
                .info(new Info()
                        .title("AIE Backend API")
                        .version("1.0")
                        .description("Documentation for AIE integration backend API"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT"))
                        .addSchemas("ResponseError", responseErrorSchema));
        

        return openAPI;
    }

    @Bean
    public OperationCustomizer globalResponseCustomizer() {
        return (Operation operation, HandlerMethod handlerMethod) -> {
            ApiResponses responses = operation.getResponses();
            
            // Add 401 Unauthorized response if not already present
            if (!responses.containsKey("401")) {
                ApiResponse unauthorizedResponse = new ApiResponse()
                        .description("Unauthorized Action")
                        .content(new Content()
                                .addMediaType("application/json",
                                        new MediaType().schema(new Schema<>().$ref("#/components/schemas/ResponseError"))));
                responses.addApiResponse("401", unauthorizedResponse);
            }
            
            // Add 500 Internal Server Error response if not already present
            if (!responses.containsKey("500")) {
                ApiResponse serverErrorResponse = new ApiResponse()
                        .description("Internal Server Error")
                        .content(new Content()
                                .addMediaType("application/json",
                                        new MediaType().schema(new Schema<>().$ref("#/components/schemas/ResponseError"))));
                responses.addApiResponse("500", serverErrorResponse);
            }
            
            return operation;
        };
    }
}