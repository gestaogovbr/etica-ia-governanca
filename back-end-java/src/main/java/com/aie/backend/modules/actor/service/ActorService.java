package com.aie.backend.modules.actor.service;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.aie.backend.modules.actor.dto.ActorResponse;
import com.aie.backend.modules.actor.dto.CreateActorRequest;
import com.aie.backend.modules.actor.dto.UpdateActorRequest;
import com.aie.backend.modules.actor.entities.Actor;
import com.aie.backend.modules.actor.repository.ActorRepository;

@Service
@Transactional
public class ActorService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ActorService.class);

    private final ActorRepository repository;

    public ActorService(ActorRepository repository) {
        this.repository = repository;
    }

    public ActorResponse create(CreateActorRequest request) {
        LOGGER.info("[ACTOR] create name='{}' active={}", request.getName(), request.getActive());
        Actor actor = new Actor();
        actor.setName(request.getName().trim());
        actor.setActive(request.getActive() == null ? Boolean.TRUE : request.getActive());

        Actor saved = repository.save(actor);
        LOGGER.info("[ACTOR] created id={} name='{}'", saved.getId(), saved.getName());
        return ActorResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ActorResponse> findAll(String active) {
        LOGGER.info("[ACTOR] findAll activeFilter={}", active);
        List<Actor> actors;
        if (active == null) {
            actors = repository.findAllByOrderByNameAsc();
        } else {
            boolean isActive = "true".equalsIgnoreCase(active.trim());
            actors = repository.findByActiveOrderByNameAsc(isActive);
        }
        LOGGER.info("[ACTOR] findAll resultCount={}", actors.size());
        return actors.stream()
                .map(ActorResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ActorResponse findOne(Long id) {
        LOGGER.info("[ACTOR] findOne id={}", id);
        Actor actor = repository.findById(id)
                .orElseThrow(() -> {
                    LOGGER.warn("[ACTOR] not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "actor.not_found");
                });
        return ActorResponse.fromEntity(actor);
    }

    public ActorResponse update(Long id, UpdateActorRequest request) {
        LOGGER.info("[ACTOR] update id={} name='{}' active={}", id, request.getName(), request.getActive());
        Actor actor = repository.findById(id)
                .orElseThrow(() -> {
                    LOGGER.warn("[ACTOR] not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "actor.not_found");
                });

        if (request.getName() != null) {
            actor.setName(request.getName().trim());
        }

        if (request.getActive() != null) {
            actor.setActive(request.getActive());
        }

        Actor saved = repository.save(actor);
        LOGGER.info("[ACTOR] updated id={} name='{}' active={}", saved.getId(), saved.getName(), saved.getActive());
        return ActorResponse.fromEntity(saved);
    }

    public Map<String, Boolean> remove(Long id) {
        LOGGER.info("[ACTOR] remove id={}", id);
        Actor actor = repository.findById(id)
                .orElseThrow(() -> {
                    LOGGER.warn("[ACTOR] not found for delete id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "actor.not_found");
                });

        repository.delete(actor);
        LOGGER.info("[ACTOR] removed id={}", id);
        return Map.of("success", Boolean.TRUE);
    }
}
