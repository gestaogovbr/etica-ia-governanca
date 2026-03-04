package com.aie.backend.modules.response.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ResponseDetail(Long id,
                             ProjectSummary project,
                             String status,
                             BigDecimal totalScore,
                             Object meta,
                             Object sessionScores,
                             List<AnswerDetail> answers,
                             Instant dateCreated,
                             Instant dateUpdated) {

    public record ProjectSummary(Long id, String name, String responsible) {}

    public record SessionSummary(Long id, String code, String name) {}

    public record QuestionSummary(Long id, String code, String text, SessionSummary session) {}

    public record AnswerDetail(Long id,
                               String value,
                               Object valueParsed,
                               QuestionSummary question,
                               Instant dateCreated,
                               Instant dateUpdated) {}
}
