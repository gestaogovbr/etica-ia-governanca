package com.aie.backend.modules.actor.dto;

import java.time.Instant;

import com.aie.backend.modules.actor.entities.Actor;

public record ActorResponse(Long id,
                            String name,
                            Boolean active,
                            Instant dateCreated,
                            Instant dateUpdated) {

    public static ActorResponse fromEntity(Actor actor) {
        return new ActorResponse(
                actor.getId(),
                actor.getName(),
                actor.getActive(),
                actor.getDateCreated(),
                actor.getDateUpdated());
    }
}
