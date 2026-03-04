package com.aie.backend.modules.response.entities;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.aie.backend.modules.project.entities.Project;
import com.aie.backend.modules.result.entities.Result;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import com.vladmihalcea.hibernate.type.json.JsonBinaryType;

@Entity
@Table(name = "responses")
public class Response {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(length = 60, nullable = false)
    private String status = "SUBMITTED";

    @Column(name = "total_score", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalScore = BigDecimal.ZERO;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Object meta;

    @Type(JsonBinaryType.class)
    @Column(name = "session_scores", columnDefinition = "jsonb")
    private Object sessionScores;

    @OneToMany(mappedBy = "response", cascade = {CascadeType.MERGE, CascadeType.PERSIST, CascadeType.REMOVE}, orphanRemoval = true)
    @JsonIgnoreProperties({"response"})
    private List<ResponseAnswer> answers;

    @OneToOne(mappedBy = "response", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"response"})
    private Result result;

    @CreationTimestamp
    @Column(name = "date_created", updatable = false)
    private Instant dateCreated;

    @UpdateTimestamp
    @Column(name = "date_updated")
    private Instant dateUpdated;

    public Long getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(BigDecimal totalScore) {
        this.totalScore = totalScore;
    }

    public Object getMeta() {
        return meta;
    }

    public void setMeta(Object meta) {
        this.meta = meta;
    }

    public Object getSessionScores() {
        return sessionScores;
    }

    public void setSessionScores(Object sessionScores) {
        this.sessionScores = sessionScores;
    }

    public List<ResponseAnswer> getAnswers() {
        return answers;
    }

    public void setAnswers(List<ResponseAnswer> answers) {
        this.answers = answers;
    }

    public Result getResult() {
        return result;
    }

    public void setResult(Result result) {
        this.result = result;
    }

    public Instant getDateCreated() {
        return dateCreated;
    }

    public Instant getDateUpdated() {
        return dateUpdated;
    }

    @JsonProperty("project_id")
    public Long getProjectId() {
        return project != null ? project.getId() : null;
    }
}
