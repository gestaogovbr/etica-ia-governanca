package com.aie.backend.modules.classificationlevel.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Size;

public class UpdateClassificationLevelRequest {

    @Size(max = 60)
    private String levelKey;
    private Integer displayOrder;
    @Size(max = 120)
    private String title;
    @Size(max = 120)
    private String subtitle;
    private String description;
    private String advice;
    private BigDecimal maxScore;
    private BigDecimal maxPercentage;
    private Integer criticalTriggerThreshold;

    public String getLevelKey() {
        return levelKey;
    }

    public void setLevelKey(String levelKey) {
        this.levelKey = levelKey;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAdvice() {
        return advice;
    }

    public void setAdvice(String advice) {
        this.advice = advice;
    }

    public BigDecimal getMaxScore() {
        return maxScore;
    }

    public void setMaxScore(BigDecimal maxScore) {
        this.maxScore = maxScore;
    }

    public BigDecimal getMaxPercentage() {
        return maxPercentage;
    }

    public void setMaxPercentage(BigDecimal maxPercentage) {
        this.maxPercentage = maxPercentage;
    }

    public Integer getCriticalTriggerThreshold() {
        return criticalTriggerThreshold;
    }

    public void setCriticalTriggerThreshold(Integer criticalTriggerThreshold) {
        this.criticalTriggerThreshold = criticalTriggerThreshold;
    }
}
