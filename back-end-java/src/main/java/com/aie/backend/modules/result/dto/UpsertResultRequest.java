package com.aie.backend.modules.result.dto;

import jakarta.validation.constraints.NotNull;

public class UpsertResultRequest {

    @NotNull
    private Long responseId;

    @NotNull
    private Object summary;

    public Long getResponseId() {
        return responseId;
    }

    public void setResponseId(Long responseId) {
        this.responseId = responseId;
    }

    public Object getSummary() {
        return summary;
    }

    public void setSummary(Object summary) {
        this.summary = summary;
    }
}
