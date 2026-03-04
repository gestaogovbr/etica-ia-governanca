package com.aie.backend.modules.dashboard.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DashboardResponse(
        @JsonProperty("overview") Overview overview,
        @JsonProperty("statusBreakdown") List<StatusBreakdown> statusBreakdown,
        @JsonProperty("sessionAverages") List<SessionAverage> sessionAverages,
        @JsonProperty("answerLeaders") List<AnswerLeader> answerLeaders) {

    public record Overview(
            @JsonProperty("totalProjects") long totalProjects,
            @JsonProperty("totalResponses") long totalResponses,
            @JsonProperty("finishedResponses") long finishedResponses) {}

    public record StatusBreakdown(
            @JsonProperty("status") String status,
            @JsonProperty("count") long count) {}

    public record SessionAverage(
            @JsonProperty("session_id") Long session_id,
            @JsonProperty("session_name") String session_name,
            @JsonProperty("average_score") double average_score,
            @JsonProperty("responses") long responses) {}

    public record AnswerLeader(
            @JsonProperty("question_id") Long question_id,
            @JsonProperty("question_text") String question_text,
            @JsonProperty("value") String value,
            @JsonProperty("count") long count) {}
}
