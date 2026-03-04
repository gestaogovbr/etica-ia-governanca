package com.aie.backend.modules.session.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class UpdateSessionRequest {

    @Size(min = 1, max = 120)
    private String code;

    @Size(min = 1, max = 200)
    private String name;

    private String description;

    @Min(0)
    @Max(999)
    private Integer priority;

    private String ethicalPrinciples;

    private Boolean active;

    private Boolean isTriage;

    private Boolean isTesting;

    @Size(max = 120)
    private String nextSessionCode;

    @Valid
    private CreateSessionRequest.TriageConfigRequest triageConfig;

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

    public CreateSessionRequest.TriageConfigRequest getTriageConfig() {
        return triageConfig;
    }

    public void setTriageConfig(CreateSessionRequest.TriageConfigRequest triageConfig) {
        this.triageConfig = triageConfig;
    }
}
