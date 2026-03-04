package com.aie.backend.modules.question.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.aie.backend.modules.question.dto.CreateQuestionRequest;
import com.aie.backend.modules.question.dto.UpdateQuestionRequest;
import com.aie.backend.modules.question.entities.Question;
import com.aie.backend.modules.question.entities.QuestionVersion;
import com.aie.backend.modules.question.repository.QuestionRepository;
import com.aie.backend.modules.question.repository.QuestionVersionRepository;
import com.aie.backend.modules.session.entities.Session;
import com.aie.backend.modules.session.repository.SessionRepository;

@Service
@Transactional
public class QuestionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(QuestionService.class);

    private final QuestionRepository repository;
    private final SessionRepository sessionRepository;
    private final QuestionVersionRepository versionRepository;

    public QuestionService(QuestionRepository repository, SessionRepository sessionRepository,
                           QuestionVersionRepository versionRepository) {
        this.repository = repository;
        this.sessionRepository = sessionRepository;
        this.versionRepository = versionRepository;
    }

    public Question create(CreateQuestionRequest request) {
        LOGGER.info("[QUESTION] create code={} sessionId={}", request.getCode(), request.getSessionId());
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "session.not_found"));

        Question q = new Question();
        q.setSession(session);
        q.setCode(request.getCode().trim());
        q.setText(request.getText().trim());
        q.setType(request.getType().trim());
        if (request.getWeights() != null) {
            q.setWeights(BigDecimal.valueOf(request.getWeights()));
        }
        q.setOrder(request.getOrder() == null ? 0 : request.getOrder());
        q.setOptions(request.getOptions());
        q.setActors(request.getActors());
        q.setConditionalField(normalizeNullable(request.getConditionalField()));
        q.setConditionalValue(normalizeNullable(request.getConditionalValue()));
        q.setIsCritical(request.getIsCritical() == null ? Boolean.FALSE : request.getIsCritical());
        q.setActive(request.getActive() == null ? Boolean.TRUE : request.getActive());

        Question saved = repository.save(q);
        return repository.findByIdAndActiveTrue(saved.getId()).orElse(saved);
    }

    public Question update(Long id, UpdateQuestionRequest request) {
        LOGGER.info("[QUESTION] update id={}", id);
        Question exists = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "question.not_found"));

        applyPatch(request, exists);

        Question saved = repository.save(exists);
        return repository.findByIdAndActiveTrue(saved.getId()).orElse(saved);
    }

    public Question updateWithVersioning(Long id, UpdateQuestionRequest request) {
        LOGGER.info("[QUESTION] updateWithVersioning id={}", id);
        Question exists = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "question.not_found"));

        snapshot(exists);

        applyPatch(request, exists);
        exists.setVersion((exists.getVersion() == null ? 1 : exists.getVersion()) + 1);

        Question saved = repository.save(exists);
        return repository.findByIdAndActiveTrue(saved.getId()).orElse(saved);
    }

    @Transactional(readOnly = true)
    public List<Question> findAll() {
        return repository.findByActiveTrueOrderByOrderAscIdAsc();
    }

    @Transactional(readOnly = true)
    public Question findOne(Long id) {
        return repository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "question.not_found"));
    }

    @Transactional(readOnly = true)
    public List<QuestionVersion> listVersions(Long questionId) {
        return versionRepository.findByQuestionIdOrderByVersionDescIdDesc(questionId);
    }

    public Question softDelete(Long id) {
        Question exists = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "question.not_found"));
        exists.setActive(Boolean.FALSE);
        return repository.save(exists);
    }

    private String normalizeNullable(String value) {
        return value == null ? null : value.trim();
    }

    private void applyPatch(UpdateQuestionRequest request, Question target) {
        if (request.getSessionId() != null) {
            Session session = sessionRepository.findById(request.getSessionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "session.not_found"));
            target.setSession(session);
        }

        if (request.getCode() != null) target.setCode(request.getCode().trim());
        if (request.getText() != null) target.setText(request.getText().trim());
        if (request.getType() != null) target.setType(request.getType().trim());
        if (request.getWeights() != null) target.setWeights(BigDecimal.valueOf(request.getWeights()));
        if (request.getOrder() != null) target.setOrder(request.getOrder());
        if (request.getOptions() != null) target.setOptions(request.getOptions());
        if (request.getActors() != null) target.setActors(request.getActors());
        if (request.getConditionalField() != null) target.setConditionalField(normalizeNullable(request.getConditionalField()));
        if (request.getConditionalValue() != null) target.setConditionalValue(normalizeNullable(request.getConditionalValue()));
        if (request.getIsCritical() != null) target.setIsCritical(request.getIsCritical());
        if (request.getActive() != null) target.setActive(request.getActive());
    }

    private void snapshot(Question exists) {
        QuestionVersion version = new QuestionVersion();
        version.setQuestion(exists);
        version.setVersion(exists.getVersion() == null ? 1 : exists.getVersion());
        version.setCode(exists.getCode());
        version.setSession(exists.getSession());
        version.setText(exists.getText());
        version.setType(exists.getType());
        version.setWeights(exists.getWeights());
        version.setOptions(exists.getOptions());
        version.setIsCritical(exists.getIsCritical());
        version.setActive(exists.getActive());
        version.setOrder(exists.getOrder());
        version.setConditionalField(exists.getConditionalField());
        version.setConditionalValue(exists.getConditionalValue());
        version.setActors(exists.getActors());
        version.setDateCreated(exists.getDateCreated());
        version.setDateUpdated(exists.getDateUpdated());
        versionRepository.save(version);
    }
}
