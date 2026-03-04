package com.aie.backend.modules.admin.dto;

import java.time.Instant;

import com.aie.backend.modules.auth.entities.Administrador;

public record AdminResponse(Long id,
                            String name,
                            String socialNumber,
                            String email,
                            String position,
                            Boolean active,
                            Instant lastAccess,
                            Instant dateCreated,
                            Instant dateUpdated) {

    public static AdminResponse fromEntity(Administrador admin) {
        return new AdminResponse(
                admin.getId(),
                admin.getName(),
                admin.getSocialNumber(),
                admin.getEmail(),
                admin.getPosition(),
                admin.getActive(),
                admin.getLastAccess(),
                admin.getDateCreated(),
                admin.getDateUpdated());
    }
}
