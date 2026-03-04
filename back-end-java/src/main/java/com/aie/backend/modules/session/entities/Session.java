package com.aie.backend.modules.session.entities;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import com.aie.backend.modules.question.entities.Question;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Type;

import com.vladmihalcea.hibernate.type.json.JsonType;

@Entity
@Table(name = "sessions", indexes = {
        @Index(name = "sessions_code_idx", columnList = "code", unique = true)
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 120, nullable = false, unique = true)
    private String code;

    @Column(length = 200, nullable = false)
    private String name;

    @Column(columnDefinition = "text", nullable = false)
    private String description;

    @Column(nullable = false)
    private Integer priority = 0;

    @Column(name = "ethical_principles", columnDefinition = "text", nullable = false)
    private String ethicalPrinciples;

    @Column(nullable = false)
    private Boolean active = Boolean.TRUE;

    @Column(name = "is_triage", nullable = false)
    private Boolean isTriage = Boolean.FALSE;

    @Column(name = "is_testing", nullable = false)
    private Boolean isTesting = Boolean.FALSE;

    @Column(name = "next_session_code", length = 120)
    private String nextSessionCode;

    @Type(JsonType.class)
    @Column(name = "triage_config", columnDefinition = "jsonb")
    private Map<String, Object> triageConfig;

    @OneToMany(mappedBy = "session")
    @JsonIgnoreProperties({"session"})
    private List<Question> questions;

    @CreationTimestamp
    @Column(name = "date_created", updatable = false)
    private Instant dateCreated;

    @UpdateTimestamp
    @Column(name = "date_updated")
    private Instant dateUpdated;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public String getEthicalPrinciples() {
        return ethicalPrinciples;
    }

    public void setEthicalPrinciples(String ethicalPrinciples) {
        this.ethicalPrinciples = ethicalPrinciples;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Boolean getIsTriage() {
        return isTriage;
    }

    public void setIsTriage(Boolean isTriage) {
        this.isTriage = isTriage;
    }

    public Boolean getIsTesting() {
        return isTesting;
    }

    public void setIsTesting(Boolean isTesting) {
        this.isTesting = isTesting;
    }

    public String getNextSessionCode() {
        return nextSessionCode;
    }

    public void setNextSessionCode(String nextSessionCode) {
        this.nextSessionCode = nextSessionCode;
    }

    public Map<String, Object> getTriageConfig() {
        return triageConfig;
    }

    public void setTriageConfig(Map<String, Object> triageConfig) {
        this.triageConfig = triageConfig;
    }

    public Instant getDateCreated() {
        return dateCreated;
    }

    public Instant getDateUpdated() {
        return dateUpdated;
    }

    public List<Question> getQuestions() {
        return questions;
    }

    public void setQuestions(List<Question> questions) {
        this.questions = questions;
    }
}
