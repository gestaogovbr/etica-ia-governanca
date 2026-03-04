package com.aie.backend.modules.project.entities;

import io.swagger.v3.oas.annotations.media.Schema;

public record ProjectDeleteResponse(
    @Schema(description = "Indicates if the operation was successful", example = "true")
    Boolean success,

    @Schema(description = "Indicates if the entity was soft deleted", example = "true")
    Boolean softDeleted
) {
    public static ProjectDeleteResponse of(Boolean success, Boolean softDeleted) {
        return new ProjectDeleteResponse(success, softDeleted);
    }
}
