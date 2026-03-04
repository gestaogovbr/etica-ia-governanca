package com.aie.backend.modules.dashboard.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aie.backend.modules.dashboard.dto.DashboardResponse;
import com.aie.backend.modules.dashboard.dto.DashboardResponse.AnswerLeader;
import com.aie.backend.modules.dashboard.dto.DashboardResponse.Overview;
import com.aie.backend.modules.dashboard.dto.DashboardResponse.SessionAverage;
import com.aie.backend.modules.dashboard.dto.DashboardResponse.StatusBreakdown;
import com.aie.backend.modules.project.repository.ProjectRepository;
import com.aie.backend.modules.question.entities.Question;
import com.aie.backend.modules.question.repository.QuestionRepository;
import com.aie.backend.modules.response.repository.ResponseAnswerRepository;
import com.aie.backend.modules.response.repository.ResponseRepository;
import com.aie.backend.modules.result.entities.Result;
import com.aie.backend.modules.result.repository.ResultRepository;

@Service
@Transactional
public class DashboardService {

    private static final Logger LOGGER = LoggerFactory.getLogger(DashboardService.class);

    private final ProjectRepository projectRepository;
    private final ResponseRepository responseRepository;
    private final ResponseAnswerRepository responseAnswerRepository;
    private final QuestionRepository questionRepository;
    private final ResultRepository resultRepository;

    public DashboardService(ProjectRepository projectRepository,
                            ResponseRepository responseRepository,
                            ResponseAnswerRepository responseAnswerRepository,
                            QuestionRepository questionRepository,
                            ResultRepository resultRepository) {
        this.projectRepository = projectRepository;
        this.responseRepository = responseRepository;
        this.responseAnswerRepository = responseAnswerRepository;
        this.questionRepository = questionRepository;
        this.resultRepository = resultRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        LOGGER.info("[DASHBOARD] building overview");
        long totalProjects = projectRepository.countActive();
        long totalResponses = responseRepository.countByProjectActiveTrue();
        long finishedResponses = responseRepository.countByStatusIgnoreCaseAndProjectActiveTrue("FINISHED");

        List<StatusBreakdown> statusBreakdown = responseRepository.countGroupByStatus()
                .stream()
                .map(item -> new StatusBreakdown(
                        item.getStatus() == null ? "UNKNOWN" : item.getStatus().toUpperCase(Locale.ROOT),
                        item.getTotal() == null ? 0 : item.getTotal()))
                .toList();

        List<SessionAverage> sessionAverages = buildSessionAverages();
        List<AnswerLeader> answerLeaders = buildAnswerLeaders();

        return new DashboardResponse(
                new Overview(totalProjects, totalResponses, finishedResponses),
                statusBreakdown,
                sessionAverages,
                answerLeaders
        );
    }

    private List<SessionAverage> buildSessionAverages() {
        List<Result> results = resultRepository.findAllByProjectActiveTrue();
        Map<Long, SessionAccumulator> accumulator = new HashMap<>();

        for (Result result : results) {
            Object summary = result.getSummary();
            if (!(summary instanceof Map<?, ?> summaryMap)) {
                continue;
            }
            Object sectionsObj = summaryMap.get("sectionPerformance");
            if (!(sectionsObj instanceof List<?> sections)) {
                continue;
            }
            for (Object sectionObj : sections) {
                if (!(sectionObj instanceof Map<?, ?> section)) {
                    continue;
                }
                Long sessionId = toLong(section.get("sessionId"));
                if (sessionId == null) {
                    sessionId = toLong(section.get("session_id"));
                }
                if (sessionId == null) {
                    continue;
                }
                Double score = toDouble(section.get("score"));
                if (score == null) {
                    continue;
                }
                String sessionName = toString(section.get("sessionName"));
                if (sessionName == null || sessionName.isBlank()) {
                    sessionName = toString(section.get("session_name"));
                }
                SessionAccumulator current = accumulator.getOrDefault(sessionId, new SessionAccumulator(sessionId, sessionName));
                SessionAccumulator updated = current.addScore(score, sessionName);
                accumulator.put(sessionId, updated);
            }
        }

        List<SessionAverage> averages = new ArrayList<>();
        for (SessionAccumulator acc : accumulator.values()) {
            double avg = acc.count == 0 ? 0 : acc.total / acc.count;
            averages.add(new SessionAverage(acc.sessionId, acc.sessionName(), avg, acc.count));
        }
        return averages;
    }

    private List<AnswerLeader> buildAnswerLeaders() {
        List<ResponseAnswerRepository.QuestionValueCount> rows = responseAnswerRepository.findGroupedByQuestion();
        Map<Long, AnswerLeader> leaders = new HashMap<>();

        for (ResponseAnswerRepository.QuestionValueCount row : rows) {
            Long questionId = row.getQuestionId();
            if (questionId == null) {
                continue;
            }
            if (!leaders.containsKey(questionId)) {
                long count = row.getTotal() == null ? 0 : row.getTotal();
                leaders.put(questionId, new AnswerLeader(
                        questionId,
                        null,
                        row.getValue(),
                        count
                ));
            }
        }

        if (leaders.isEmpty()) {
            return List.of();
        }

        List<Question> questions = questionRepository.findByIdIn(leaders.keySet());
        for (Question question : questions) {
            AnswerLeader leader = leaders.get(question.getId());
            if (leader != null) {
                leaders.put(question.getId(), new AnswerLeader(
                        leader.question_id(),
                        question.getText() != null ? question.getText() : question.getCode(),
                        leader.value(),
                        leader.count()
                ));
            }
        }

        return new ArrayList<>(leaders.values());
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String str) {
            try {
                return Long.parseLong(str);
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private Double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value instanceof String str) {
            try {
                return Double.parseDouble(str);
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private String toString(Object value) {
        if (value == null) {
            return null;
        }
        String str = Objects.toString(value, null);
        return str != null ? str.trim() : null;
    }

    private record SessionAccumulator(Long sessionId, String sessionName, double total, long count) {
        SessionAccumulator(Long sessionId, String sessionName) {
            this(sessionId, sessionName, 0d, 0L);
        }

        SessionAccumulator addScore(double score, String preferredName) {
            String finalName = (sessionName != null && !sessionName.isBlank())
                    ? sessionName
                    : (preferredName != null && !preferredName.isBlank() ? preferredName : sessionName);
            return new SessionAccumulator(sessionId, finalName, total + score, count + 1);
        }

        public String sessionName() {
            return sessionName != null ? sessionName : ("Sessão " + sessionId);
        }
    }
}
