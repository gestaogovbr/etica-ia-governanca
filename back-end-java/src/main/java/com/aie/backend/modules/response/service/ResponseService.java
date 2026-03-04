package com.aie.backend.modules.response.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.aie.backend.modules.project.entities.Project;
import com.aie.backend.modules.project.repository.ProjectRepository;
import com.aie.backend.modules.question.entities.Question;
import com.aie.backend.modules.question.repository.QuestionRepository;
import com.aie.backend.modules.response.dto.CreateResponseRequest;
import com.aie.backend.modules.response.dto.ResponseFilters;
import com.aie.backend.modules.response.entities.Response;
import com.aie.backend.modules.response.entities.ResponseAnswer;
import com.aie.backend.modules.response.repository.ResponseAnswerRepository;
import com.aie.backend.modules.response.repository.ResponseRepository;

@Service
@Transactional
public class ResponseService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ResponseService.class);

    private final ResponseRepository repository;
    private final ResponseAnswerRepository answerRepository;
    private final ProjectRepository projectRepository;
    private final QuestionRepository questionRepository;

    public ResponseService(ResponseRepository repository,
                           ResponseAnswerRepository answerRepository,
                           ProjectRepository projectRepository,
                           QuestionRepository questionRepository) {
        this.repository = repository;
        this.answerRepository = answerRepository;
        this.projectRepository = projectRepository;
        this.questionRepository = questionRepository;
    }

    public Response create(CreateResponseRequest request) {
        LOGGER.info("[RESPONSE] create projectId={} responseId={}", request.getProjectId(), request.getResponseId());

        List<CreateResponseRequest.CreateAnswerRequest> sanitized = Optional.ofNullable(request.getAnswers())
                .orElse(List.of())
                .stream()
                .filter(ans -> hasValue(ans.getValue()))
                .toList();

        if (sanitized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "response.answers_required");
        }

        Project project = projectRepository.findByIdAndActiveTrue(request.getProjectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "project.not_found"));

        List<Long> questionIds = sanitized.stream().map(CreateResponseRequest.CreateAnswerRequest::getQuestionId).toList();
        List<Question> questions = questionRepository.findByIdIn(questionIds);
        Map<Long, Question> questionMap = new HashMap<>();
        questions.forEach(q -> questionMap.put(q.getId(), q));

        List<ResponseAnswer> answers = new ArrayList<>();
        for (CreateResponseRequest.CreateAnswerRequest input : sanitized) {
            Question question = questionMap.get(input.getQuestionId());
            if (question == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "question.not_found");
            }
            Object normalized = normalizeValue(question, input.getValue());
            TextParsed pair = stringifyValue(normalized);
            BigDecimal points = calculatePoints(question, pair.parsedValue());

            ResponseAnswer answer = new ResponseAnswer();
            answer.setQuestion(question);
            answer.setValue(pair.textValue());
            answer.setValueParsed(pair.parsedValue());
            answer.setPoints(points);
            answers.add(answer);
        }

        BigDecimal total = answers.stream()
                .map(ResponseAnswer::getPoints)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Map<String, Object>> defaultSessionScores = buildSessionScores(answers);
        List<Map<String, Object>> mergedSessionScores = mergeSessionScores(defaultSessionScores, request.getSessionScores());

        if (request.getResponseId() != null) {
            Response response = repository.findById(request.getResponseId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "response.not_found"));
            if (!Objects.equals(response.getProject().getId(), project.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "response.project_mismatch");
            }

            if (!questionIds.isEmpty()) {
                List<Long> ids = questionIds;
                answerRepository.deleteByResponseIdAndQuestionIds(response.getId(), ids);
            }
            answers.forEach(ans -> ans.setResponse(response));
            if (!answers.isEmpty()) {
                answerRepository.saveAll(answers);
            }

            List<ResponseAnswer> allAnswers = answerRepository.findByResponseIdWithQuestion(response.getId());
            List<Map<String, Object>> updatedSessionScores = mergeSessionScores(buildSessionScores(allAnswers), request.getSessionScores());

            response.setSessionScores(updatedSessionScores);
            response.setTotalScore(roundScore(allAnswers.stream()
                    .map(ResponseAnswer::getPoints)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)));
            response.setStatus(normalizeStatus(request.getStatus(), response.getStatus()));
            response.setMeta(Map.of("answeredQuestions", allAnswers.size()));

            Response saved = repository.save(response);
            updateProjectPreTriagemSummary(project.getId(), updatedSessionScores);
            return saved;
        }

        Response response = new Response();
        response.setProject(project);
        response.setStatus(normalizeStatus(request.getStatus(), "SUBMITTED"));
        response.setTotalScore(roundScore(total));
        response.setMeta(Map.of("answeredQuestions", answers.size()));
        response.setSessionScores(mergedSessionScores);
        response.setAnswers(answers);
        answers.forEach(ans -> ans.setResponse(response));

        Response saved = repository.save(response);
        updateProjectPreTriagemSummary(project.getId(), mergedSessionScores);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Response> findAll(ResponseFilters filters) {
        Long projectId = filters != null ? filters.getProjectId() : null;
        String status = filters != null ? normalizeStatus(filters.getStatus(), null) : null;
        List<Response> responses = repository.findWithProjectAndResult(projectId, status);
        responses.forEach(r -> r.setAnswers(null));
        return responses;
    }

    @Transactional(readOnly = true)
    public Response findOne(Long id) {
        Response response = repository.findDetailById(id);
        if (response == null || (response.getProject() != null && Boolean.FALSE.equals(response.getProject().getActive()))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "response.not_found");
        }
        return response;
    }

    private boolean hasValue(Object value) {
        if (value instanceof List<?> list) {
            return !list.isEmpty();
        }
        if (value instanceof String str) {
            return !str.trim().isEmpty();
        }
        return value != null;
    }

    private Object normalizeValue(Question question, Object raw) {
        String type = Optional.ofNullable(question.getType()).orElse("").toLowerCase(Locale.ROOT);
        if ("checkbox".equals(type)) {
            return normalizeArrayValue(raw);
        }
        if (raw == null) {
            return null;
        }
        if (raw instanceof String str) {
            String trimmed = str.trim();
            return trimmed.isEmpty() ? null : trimmed;
        }
        return raw;
    }

    private List<String> normalizeArrayValue(Object raw) {
        List<String> values = new ArrayList<>();
        if (raw instanceof List<?> list) {
            list.stream().map(String::valueOf).map(String::trim).filter(s -> !s.isEmpty()).forEach(values::add);
        } else if (raw instanceof String str) {
            String trimmed = str.trim();
            if (!trimmed.isEmpty()) {
                if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        List<?> parsed = mapper.readValue(trimmed, List.class);
                        parsed.stream().map(String::valueOf).map(String::trim).filter(s -> !s.isEmpty()).forEach(values::add);
                    } catch (Exception ignored) {
                        // fallback below
                    }
                }
                if (values.isEmpty()) {
                    for (String part : trimmed.split(",")) {
                        String val = part.trim();
                        if (!val.isEmpty()) {
                            values.add(val);
                        }
                    }
                }
            }
        }
        return values.stream().distinct().toList();
    }

    private TextParsed stringifyValue(Object value) {
        if (value == null) {
            return new TextParsed(null, null);
        }
        if (value instanceof List<?> || value instanceof Map<?, ?>) {
            try {
                String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(value);
                return new TextParsed(json, value);
            } catch (Exception ex) {
                return new TextParsed(value.toString(), value);
            }
        }
        if (value instanceof String str) {
            var textNode = com.fasterxml.jackson.databind.node.TextNode.valueOf(str);
            return new TextParsed(str, textNode);
        }
        return new TextParsed(value.toString(), value);
    }

    private BigDecimal calculatePoints(Question question, Object value) {
        if (question == null) {
            return BigDecimal.ZERO;
        }
        double weight = Optional.ofNullable(question.getWeights()).map(BigDecimal::doubleValue).orElse(1d);
        List<Map<String, Object>> options = normalizeOptions(question.getOptions());
        if (options.isEmpty()) {
            return BigDecimal.ZERO;
        }
        String type = Optional.ofNullable(question.getType()).orElse("").toLowerCase(Locale.ROOT);
        double total;
        if ("checkbox".equals(type) && value instanceof List<?> list) {
            total = list.stream()
                    .map(val -> findOptionPoints(options, String.valueOf(val)))
                    .reduce(0d, Double::sum);
        } else {
            total = findOptionPoints(options, value);
        }
        return roundScore(total * weight);
    }

    private double findOptionPoints(List<Map<String, Object>> options, Object value) {
        if (value == null) {
            return 0d;
        }
        String target = String.valueOf(value);
        return options.stream()
                .filter(opt -> target.equals(String.valueOf(opt.get("value"))))
                .map(opt -> opt.get("points"))
                .mapToDouble(val -> {
                    if (val instanceof Number num) return num.doubleValue();
                    try {
                        return Double.parseDouble(String.valueOf(val));
                    } catch (NumberFormatException ignored) {
                        return 0d;
                    }
                })
                .findFirst()
                .orElse(0d);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> normalizeOptions(Object raw) {
        if (raw == null) {
            return List.of();
        }
        if (raw instanceof List<?> list) {
            List<Map<String, Object>> mapped = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    Map<String, Object> safe = new HashMap<>();
                    map.forEach((k, v) -> safe.put(String.valueOf(k), v));
                    mapped.add(safe);
                }
            }
            return mapped;
        }
        if (raw instanceof String str) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                List<Map<String, Object>> parsed = mapper.readValue(str, List.class);
                return parsed;
            } catch (Exception ex) {
                return List.of();
            }
        }
        return List.of();
    }

    private List<Map<String, Object>> buildSessionScores(List<ResponseAnswer> answers) {
        Map<Long, Map<String, Object>> accumulator = new HashMap<>();
        for (ResponseAnswer answer : answers) {
            if (answer.getQuestion() == null || answer.getQuestion().getSession() == null) {
                continue;
            }
            var session = answer.getQuestion().getSession();
            Map<String, Object> current = accumulator.getOrDefault(session.getId(), new HashMap<>());
            current.put("session_id", session.getId());
            current.put("session_code", session.getCode());
            current.put("session_name", session.getName());
            double score = ((Number) current.getOrDefault("score", 0)).doubleValue();
            double points = Optional.ofNullable(answer.getPoints()).map(BigDecimal::doubleValue).orElse(0d);
            current.put("score", roundScore(score + points).doubleValue());
            accumulator.put(session.getId(), current);
        }
        return new ArrayList<>(accumulator.values());
    }

    private List<Map<String, Object>> mergeSessionScores(List<Map<String, Object>> base, List<CreateResponseRequest.CreateSessionScoreRequest> incoming) {
        if (incoming == null || incoming.isEmpty()) {
            return base;
        }
        Map<Long, Map<String, Object>> merged = new HashMap<>();
        for (Map<String, Object> item : base) {
            Long sessionId = toLong(item.get("session_id"));
            if (sessionId != null) {
                merged.put(sessionId, new HashMap<>(item));
            }
        }
        for (CreateResponseRequest.CreateSessionScoreRequest item : incoming) {
            if (item.getSessionId() == null) {
                continue;
            }
            Map<String, Object> existing = merged.getOrDefault(item.getSessionId(), new HashMap<>());
            existing.put("session_id", item.getSessionId());
            existing.put("session_code", item.getSessionCode() != null ? item.getSessionCode() : existing.get("session_code"));
            existing.put("session_name", item.getSessionName() != null ? item.getSessionName() : existing.get("session_name"));
            existing.put("score", roundScore(item.getScore()).doubleValue());
            existing.put("level", item.getLevel() != null ? item.getLevel() : existing.get("level"));
            existing.put("meta", item.getMeta() != null ? item.getMeta() : existing.get("meta"));
            merged.put(item.getSessionId(), existing);
        }
        return new ArrayList<>(merged.values());
    }

    private void updateProjectPreTriagemSummary(Long projectId, List<Map<String, Object>> sessionScores) {
        if (projectId == null || sessionScores == null || sessionScores.isEmpty()) {
            return;
        }
        for (Map<String, Object> item : sessionScores) {
            String code = Optional.ofNullable(item.get("session_code")).map(Object::toString).orElse("").toLowerCase(Locale.ROOT);
            String name = Optional.ofNullable(item.get("session_name")).map(Object::toString).orElse("").toLowerCase(Locale.ROOT);
            if (code.equals("pretriagem") || name.contains("triagem")) {
                String level = Objects.toString(item.get("level"), null);
                Double score = item.get("score") instanceof Number num ? num.doubleValue() : null;
                var patch = new HashMap<String, Object>();
                if (level != null) patch.put("lastPretriagemLevel", level);
                if (score != null) patch.put("lastPretriagemScore", roundScore(score));
                if (!patch.isEmpty()) {
                    projectRepository.findByIdAndActiveTrue(projectId).ifPresent(project -> {
                        if (patch.containsKey("lastPretriagemLevel")) {
                            project.setLastPretriagemLevel((String) patch.get("lastPretriagemLevel"));
                        }
                        if (patch.containsKey("lastPretriagemScore")) {
                            project.setLastPretriagemScore((BigDecimal) patch.get("lastPretriagemScore"));
                        }
                        projectRepository.save(project);
                    });
                }
                return;
            }
        }
    }

    private BigDecimal roundScore(BigDecimal value) {
        if (value == null) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal roundScore(double value) {
        return roundScore(BigDecimal.valueOf(value));
    }

    private String normalizeStatus(String status, String fallback) {
        return status == null ? fallback : status.trim().toUpperCase(Locale.ROOT);
    }

    private Long toLong(Object value) {
        if (value instanceof Number num) {
            return num.longValue();
        }
        if (value instanceof String str) {
            try {
                return Long.parseLong(str);
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private record TextParsed(String textValue, Object parsedValue) {}
}
