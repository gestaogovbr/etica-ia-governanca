package com.aie.backend.modules.question.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class UpdateQuestionRequest {

    private Long sessionId;

    @Size(max = 120)
    private String code;

    private String text;

    private String type;

    private Double weights;

    @Min(0)
    @Max(9999)
    private Integer order;

    private Object options;

    private Object actors;

    private String conditionalField;

    private String conditionalValue;

    private Boolean isCritical;

    private Boolean active;

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
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

    public Double getWeights() {
        return weights;
    }

    public void setWeights(Double weights) {
        this.weights = weights;
    }

    public Integer getOrder() {
        return order;
    }

    public void setOrder(Integer order) {
        this.order = order;
    }

    public Object getOptions() {
        return options;
    }

    public void setOptions(Object options) {
        this.options = options;
    }

    public Object getActors() {
        return actors;
    }

    public void setActors(Object actors) {
        this.actors = actors;
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
}
