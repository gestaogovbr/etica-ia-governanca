package com.aie.backend.modules.project.entities;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.aie.backend.modules.auth.entities.Administrador;
import com.aie.backend.modules.response.entities.Response;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 150, nullable = false)
    private String name;

    @Column(length = 150, nullable = false)
    private String responsible;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "last_pretriagem_level", length = 50)
    private String lastPretriagemLevel;

    @Column(name = "last_pretriagem_score", precision = 10, scale = 2)
    private BigDecimal lastPretriagemScore;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    @JsonIgnoreProperties({"password", "hibernateLazyInitializer", "handler"})
    private Administrador owner;

    @OneToMany(mappedBy = "project")
    @JsonIgnore
    private List<Response> responses;

    @OneToMany(mappedBy = "project")
    @JsonIgnore
    private List<ProjectShare> shares;

    @CreationTimestamp
    @Column(name = "date_created", updatable = false)
    private Instant dateCreated;

    @UpdateTimestamp
    @Column(name = "date_updated")
    private Instant dateUpdated;

    @Transient
    @JsonProperty("is_owner")
    private Boolean isOwner;

    @Transient
    @JsonProperty("shared_with_me")
    private Boolean sharedWithMe;

    @Transient
    @JsonProperty("responses_count")
    private Long responsesCount;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public BigDecimal getLastPretriagemScore() {
        return lastPretriagemScore;
    }

    public void setLastPretriagemScore(BigDecimal lastPretriagemScore) {
        this.lastPretriagemScore = lastPretriagemScore;
    }

    public Administrador getOwner() {
        return owner;
    }

    public void setOwner(Administrador owner) {
        this.owner = owner;
    }

    public List<Response> getResponses() {
        return responses;
    }

    public void setResponses(List<Response> responses) {
        this.responses = responses;
    }

    public List<ProjectShare> getShares() {
        return shares;
    }

    public void setShares(List<ProjectShare> shares) {
        this.shares = shares;
    }

    public Instant getDateCreated() {
        return dateCreated;
    }

    public Instant getDateUpdated() {
        return dateUpdated;
    }

    public Boolean getIsOwner() {
        return isOwner;
    }

    public void setIsOwner(Boolean isOwner) {
        this.isOwner = isOwner;
    }

    public Boolean getSharedWithMe() {
        return sharedWithMe;
    }

    public void setSharedWithMe(Boolean sharedWithMe) {
        this.sharedWithMe = sharedWithMe;
    }

    public Long getResponsesCount() {
        return responsesCount;
    }

    public void setResponsesCount(Long responsesCount) {
        this.responsesCount = responsesCount;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    @JsonProperty("owner_id")
    public Long getOwnerId() {
        return owner != null ? owner.getId() : null;
    }
}
