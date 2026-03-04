package com.aie.backend.modules.project.dto;

import jakarta.validation.constraints.Size;

public class UpdateProjectRequest {

    @Size(max = 150)
    private String name;

    @Size(max = 150)
    private String responsible;

    @Size(max = 4000)
    private String description;

    @Size(max = 50)
    private String lastPretriagemLevel;

    private Double lastPretriagemScore;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getResponsible() {
        return responsible;
    }

    public void setResponsible(String responsible) {
        this.responsible = responsible;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLastPretriagemLevel() {
        return lastPretriagemLevel;
    }

    public void setLastPretriagemLevel(String lastPretriagemLevel) {
        this.lastPretriagemLevel = lastPretriagemLevel;
    }

    public Double getLastPretriagemScore() {
        return lastPretriagemScore;
    }

    public void setLastPretriagemScore(Double lastPretriagemScore) {
        this.lastPretriagemScore = lastPretriagemScore;
    }
}
