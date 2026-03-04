package com.aie.backend.modules.session.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateSessionRequest {

    @NotBlank
    @Size(max = 120)
    private String code;

    @NotBlank
    @Size(max = 200)
    private String name;

    @NotBlank
    private String description;

    @NotNull
    @Min(0)
    @Max(999)
    private Integer priority;

    @NotBlank
    private String ethicalPrinciples;

    private Boolean active = Boolean.TRUE;

    private Boolean isTriage = Boolean.FALSE;

    private Boolean isTesting = Boolean.FALSE;

    @Size(max = 120)
    private String nextSessionCode;

    @Valid
    private TriageConfigRequest triageConfig;

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

    public TriageConfigRequest getTriageConfig() {
        return triageConfig;
    }

    public void setTriageConfig(TriageConfigRequest triageConfig) {
        this.triageConfig = triageConfig;
    }

    public static class TriageConfigRequest {

        @Valid
        private List<TriageLevelRequest> levels;

        public List<TriageLevelRequest> getLevels() {
            return levels;
        }

        public void setLevels(List<TriageLevelRequest> levels) {
            this.levels = levels;
        }
    }

    public static class TriageLevelRequest {
        @NotBlank
        private String key;

        @NotBlank
        private String label;

        @NotNull
        private Number minScore;

        @Size(max = 120)
        private String nextSessionCode;

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public Number getMinScore() {
            return minScore;
        }

        public void setMinScore(Number minScore) {
            this.minScore = minScore;
        }

        public String getNextSessionCode() {
            return nextSessionCode;
        }

        public void setNextSessionCode(String nextSessionCode) {
            this.nextSessionCode = nextSessionCode;
        }
    }
}
