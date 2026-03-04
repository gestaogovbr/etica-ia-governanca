package com.aie.backend.modules.session.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.aie.backend.modules.session.dto.CreateSessionRequest;
import com.aie.backend.modules.session.dto.UpdateSessionRequest;
import com.aie.backend.modules.session.entities.Session;
import com.aie.backend.modules.session.repository.SessionRepository;

@Service
@Transactional
public class SessionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(SessionService.class);

    private final SessionRepository repository;

    public SessionService(SessionRepository repository) {
        this.repository = repository;
    }

    public Session create(CreateSessionRequest request) {
        String code = normalize(request.getCode());
        LOGGER.info("[SESSION] create code='{}' name='{}'", code, request.getName());

        repository.findByCodeIgnoreCase(code)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "session.code_exists");
                });

        Session session = new Session();
        session.setCode(code);
        session.setName(normalize(request.getName()));
        session.setDescription(normalize(request.getDescription()));
        session.setPriority(request.getPriority());
        session.setEthicalPrinciples(normalize(request.getEthicalPrinciples()));
        session.setActive(request.getActive() == null ? Boolean.TRUE : request.getActive());
        session.setIsTriage(request.getIsTriage() == null ? Boolean.FALSE : request.getIsTriage());
        session.setIsTesting(request.getIsTesting() == null ? Boolean.FALSE : request.getIsTesting());
        // Permite encadear mesmo para sessões de pré-triagem
        session.setNextSessionCode(normalizeNextSessionCode(request.getNextSessionCode()));
        session.setTriageConfig(normalizeTriageConfig(request.getIsTriage(), request.getTriageConfig()));

        Session saved = repository.save(session);
        LOGGER.info("[SESSION] created id={} code='{}'", saved.getId(), saved.getCode());
        return saved;
    }

    public Session update(Long id, UpdateSessionRequest request) {
        LOGGER.info("[SESSION] update id={} code='{}' name='{}'", id, request.getCode(), request.getName());
        Session session = repository.findById(id)
                .orElseThrow(() -> {
                    LOGGER.warn("[SESSION] not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "session.not_found");
                });

        if (request.getCode() != null) {
            String code = normalize(request.getCode());
            if (!code.equalsIgnoreCase(session.getCode())) {
                repository.findByCodeIgnoreCase(code)
                        .filter(existing -> !Objects.equals(existing.getId(), id))
                        .ifPresent(existing -> {
                            throw new ResponseStatusException(HttpStatus.CONFLICT, "session.code_exists");
                        });
                session.setCode(code);
            }
        }

        if (request.getName() != null) {
            session.setName(normalize(request.getName()));
        }

        if (request.getDescription() != null) {
            session.setDescription(normalize(request.getDescription()));
        }

        if (request.getPriority() != null) {
            session.setPriority(request.getPriority());
        }

        if (request.getEthicalPrinciples() != null) {
            session.setEthicalPrinciples(normalize(request.getEthicalPrinciples()));
        }

        Boolean isTriage = request.getIsTriage() != null ? request.getIsTriage() : session.getIsTriage();
        if (request.getIsTriage() != null) {
            session.setIsTriage(isTriage);
        }

        if (request.getIsTriage() != null || request.getTriageConfig() != null) {
            session.setTriageConfig(normalizeTriageConfig(isTriage, request.getTriageConfig()));
        }

        if (request.getIsTesting() != null) {
            session.setIsTesting(request.getIsTesting());
        }

        if (request.getIsTriage() != null || request.getNextSessionCode() != null) {
            // Mantém o próximo passo mesmo para sessões de pré-triagem
            session.setNextSessionCode(normalizeNextSessionCode(request.getNextSessionCode()));
        }

        if (request.getActive() != null) {
            session.setActive(request.getActive());
        }

        Session saved = repository.save(session);
        LOGGER.info("[SESSION] updated id={} code='{}'", saved.getId(), saved.getCode());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Session> findAll(boolean isAdmin) {
        LOGGER.info("[SESSION] findAll admin={}", isAdmin);
        return repository.findByActiveTrueOrderByIdAsc()
                .stream()
                .filter(session -> isAdmin || !Boolean.TRUE.equals(session.getIsTesting()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Session findOne(Long id) {
        LOGGER.info("[SESSION] findOne id={}", id);
        Session session = repository.findWithQuestionsById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "session.not_found"));
        if (session.getQuestions() != null) {
            session.getQuestions().sort((a, b) -> {
                int cmp = Integer.compare(
                        a.getOrder() != null ? a.getOrder() : 0,
                        b.getOrder() != null ? b.getOrder() : 0
                );
                if (cmp != 0) return cmp;
                return Long.compare(a.getId() != null ? a.getId() : 0, b.getId() != null ? b.getId() : 0);
            });
        }
        return session;
    }

    public Session softDelete(Long id) {
        LOGGER.info("[SESSION] softDelete id={}", id);
        Session session = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "session.not_found"));
        if (Boolean.FALSE.equals(session.getActive())) {
            return session;
        }
        session.setActive(Boolean.FALSE);
        Session saved = repository.save(session);
        LOGGER.info("[SESSION] softDeleted id={}", saved.getId());
        return saved;
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeNextSessionCode(String nextSessionCode) {
        return normalize(nextSessionCode);
    }

    private Map<String, Object> normalizeTriageConfig(Boolean isTriage, CreateSessionRequest.TriageConfigRequest config) {
        if (!Boolean.TRUE.equals(isTriage) || config == null || config.getLevels() == null) {
            return null;
        }

        List<Map<String, Object>> levels = config.getLevels().stream()
                .map(level -> {
                    String key = normalize(level.getKey());
                    String label = normalize(level.getLabel());
                    Number minScore = level.getMinScore();
                    String nextSessionCode = normalize(level.getNextSessionCode());
                    if (key == null || key.isBlank() || label == null || label.isBlank() || minScore == null) {
                        return null;
                    }
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("key", key);
                    payload.put("label", label);
                    payload.put("min_score", minScore.doubleValue());
                    if (nextSessionCode != null && !nextSessionCode.isBlank()) {
                        payload.put("next_session_code", nextSessionCode);
                    }
                    return payload;
                })
                .filter(Objects::nonNull)
                .toList();

        if (levels.isEmpty()) {
            return null;
        }

        return Map.of("levels", levels);
    }
}
