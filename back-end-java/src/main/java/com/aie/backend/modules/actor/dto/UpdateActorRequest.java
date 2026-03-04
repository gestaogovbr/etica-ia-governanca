package com.aie.backend.modules.actor.dto;

import jakarta.validation.constraints.Size;

public class UpdateActorRequest {

    @Size(min = 1, max = 150)
    private String name;

    private Boolean active;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
