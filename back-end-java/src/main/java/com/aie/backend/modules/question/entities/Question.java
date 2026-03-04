package com.aie.backend.modules.question.entities;

import java.math.BigDecimal;
import java.time.Instant;

import com.aie.backend.modules.session.entities.Session;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import com.vladmihalcea.hibernate.type.json.JsonBinaryType;

@Entity
@Table(name = "questions", indexes = {
        @Index(name = "questions_code_idx", columnList = "code")
})
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 120, nullable = false)
    private String code;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "session_id")
    @JsonIgnoreProperties({"questions", "hibernateLazyInitializer", "handler"})
    private Session session;

    @Column(name = "text", columnDefinition = "text", nullable = false)
    private String text;

    @Column(length = 30, nullable = false)
    private String type;

    @Column(name = "weights", precision = 10, scale = 2, nullable = false)
    private BigDecimal weights = BigDecimal.valueOf(1);

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Object options;

    @Column(name = "is_critical", nullable = false)
    private Boolean isCritical = Boolean.FALSE;

    @Column(nullable = false)
    private Boolean active = Boolean.TRUE;

    @Column(name = "\"order\"", nullable = false)
    private Integer order = 0;

    @Column(name = "version", nullable = false)
    private Integer version = 1;

    @Column(name = "conditional_field", length = 120)
    private String conditionalField;

    @Column(name = "conditional_value", length = 250)
    private String conditionalValue;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Object actors;

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

    public Session getSession() {
        return session;
    }

    public void setSession(Session session) {
        this.session = session;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public BigDecimal getWeights() {
        return weights;
    }

    public void setWeights(BigDecimal weights) {
        this.weights = weights;
    }

    public Object getOptions() {
        return options;
    }

    public void setOptions(Object options) {
        this.options = options;
    }

    public Boolean getIsCritical() {
        return isCritical;
    }

    public void setIsCritical(Boolean isCritical) {
        this.isCritical = isCritical;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Integer getOrder() {
        return order;
    }

    public void setOrder(Integer order) {
        this.order = order;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public String getConditionalField() {
        return conditionalField;
    }

    public void setConditionalField(String conditionalField) {
        this.conditionalField = conditionalField;
    }

    public String getConditionalValue() {
        return conditionalValue;
    }

    public void setConditionalValue(String conditionalValue) {
        this.conditionalValue = conditionalValue;
    }

    public Object getActors() {
        return actors;
    }

    public void setActors(Object actors) {
        this.actors = actors;
    }

    public Instant getDateCreated() {
        return dateCreated;
    }

    public Instant getDateUpdated() {
        return dateUpdated;
    }

    @JsonProperty("session_id")
    public Long getSessionId() {
        return session != null ? session.getId() : null;
    }
}
