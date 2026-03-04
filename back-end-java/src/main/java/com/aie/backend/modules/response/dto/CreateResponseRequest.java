package com.aie.backend.modules.response.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public class CreateResponseRequest {

    @NotNull
    private Long projectId;

    private String status;

    private Long responseId;

    @Valid
    @NotEmpty
    private List<CreateAnswerRequest> answers;

    @Valid
    private List<CreateSessionScoreRequest> sessionScores;

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getResponseId() {
        return responseId;
    }

    public void setResponseId(Long responseId) {
        this.responseId = responseId;
    }

    public List<CreateAnswerRequest> getAnswers() {
        return answers;
    }

    public void setAnswers(List<CreateAnswerRequest> answers) {
        this.answers = answers;
    }

    public List<CreateSessionScoreRequest> getSessionScores() {
        return sessionScores;
    }

    public void setSessionScores(List<CreateSessionScoreRequest> sessionScores) {
        this.sessionScores = sessionScores;
    }

    public static class CreateAnswerRequest {
        @NotNull
        private Long questionId;
        private Object value;

        public Long getQuestionId() {
            return questionId;
        }

        public void setQuestionId(Long questionId) {
            this.questionId = questionId;
        }

        public Object getValue() {
            return value;
        }

        public void setValue(Object value) {
            this.value = value;
        }
    }

    public static class CreateSessionScoreRequest {
        @NotNull
        private Long sessionId;
        private String sessionCode;
        private String sessionName;
        @NotNull
        private Double score;
        private String level;
        private Object meta;

        public Long getSessionId() {
            return sessionId;
        }

        public void setSessionId(Long sessionId) {
            this.sessionId = sessionId;
        }

        public String getSessionCode() {
            return sessionCode;
        }

        public void setSessionCode(String sessionCode) {
            this.sessionCode = sessionCode;
        }

        public String getSessionName() {
            return sessionName;
        }

        public void setSessionName(String sessionName) {
            this.sessionName = sessionName;
        }

        public Double getScore() {
            return score;
        }

        public void setScore(Double score) {
            this.score = score;
        }

        public String getLevel() {
            return level;
        }

        public void setLevel(String level) {
            this.level = level;
        }

        public Object getMeta() {
            return meta;
        }

        public void setMeta(Object meta) {
            this.meta = meta;
        }
    }
}
