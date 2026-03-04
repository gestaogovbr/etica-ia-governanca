package com.aie.backend.modules.session.dto;

import java.time.Instant;
import java.util.Map;

import com.aie.backend.modules.session.entities.Session;

public record SessionResponse(Long id,
                              String code,
                              String name,
                              String description,
                              Integer priority,
                              String ethicalPrinciples,
                              Boolean active,
                              Boolean isTriage,
                              Boolean isTesting,
                              String nextSessionCode,
                              Map<String, Object> triageConfig,
                              Instant dateCreated,
                              Instant dateUpdated) {

    public static SessionResponse fromEntity(Session session) {
        return new SessionResponse(
                session.getId(),
                session.getCode(),
                session.getName(),
                session.getDescription(),
                session.getPriority(),
                session.getEthicalPrinciples(),
                session.getActive(),
                session.getIsTriage(),
                session.getIsTesting(),
                session.getNextSessionCode(),
                session.getTriageConfig(),
                session.getDateCreated(),
                session.getDateUpdated()
        );
    }
}
