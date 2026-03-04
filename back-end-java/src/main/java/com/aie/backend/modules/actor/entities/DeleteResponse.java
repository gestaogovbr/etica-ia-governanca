package com.aie.backend.modules.actor.entities;

import io.swagger.v3.oas.annotations.media.Schema;

public record DeleteResponse(
    @Schema(description = "Indicates if the operation was successful", example = "true")
    Boolean success
) {
    public static DeleteResponse of(Boolean success) {
        return new DeleteResponse(success);
    }
}
