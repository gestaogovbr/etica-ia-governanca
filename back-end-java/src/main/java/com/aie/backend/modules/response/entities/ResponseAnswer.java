package com.aie.backend.modules.response.entities;

import java.math.BigDecimal;
import java.time.Instant;

import com.aie.backend.modules.question.entities.Question;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import com.vladmihalcea.hibernate.type.json.JsonBinaryType;

@Entity
@Table(name = "response_answers")
@JsonIgnoreProperties({"response"})
public class ResponseAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "response_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Response response;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(columnDefinition = "text")
    private String value;

    @Type(JsonBinaryType.class)
    @Column(name = "value_parsed", columnDefinition = "jsonb")
    private Object valueParsed;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal points = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "date_created", updatable = false)
    private Instant dateCreated;

    @UpdateTimestamp
    @Column(name = "date_updated")
    private Instant dateUpdated;

    public Long getId() {
        return id;
    }

    public Response getResponse() {
        return response;
    }

    public void setResponse(Response response) {
        this.response = response;
    }

    public Question getQuestion() {
        return question;
    }

    public void setQuestion(Question question) {
        this.question = question;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public Object getValueParsed() {
        return valueParsed;
    }

    public void setValueParsed(Object valueParsed) {
        this.valueParsed = valueParsed;
    }

    public BigDecimal getPoints() {
        return points;
    }

    public void setPoints(BigDecimal points) {
        this.points = points;
    }

    public Instant getDateCreated() {
        return dateCreated;
    }

    public Instant getDateUpdated() {
        return dateUpdated;
    }

    @JsonProperty("response_id")
    public Long getResponseId() {
        return response != null ? response.getId() : null;
    }

    @JsonProperty("question_id")
    public Long getQuestionId() {
        return question != null ? question.getId() : null;
    }
}
