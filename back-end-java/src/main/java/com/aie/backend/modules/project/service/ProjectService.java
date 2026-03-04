package com.aie.backend.modules.project.service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.aie.backend.modules.auth.entities.Administrador;
import com.aie.backend.modules.auth.security.AuthenticatedAdmin;
import com.aie.backend.modules.project.dto.CreateProjectRequest;
import com.aie.backend.modules.project.dto.ProjectShareRequest;
import com.aie.backend.modules.project.dto.UpdateProjectRequest;
import com.aie.backend.modules.project.entities.Project;
import com.aie.backend.modules.project.entities.ProjectShare;
import com.aie.backend.modules.project.repository.ProjectRepository;
import com.aie.backend.modules.project.repository.ProjectShareRepository;
import com.aie.backend.modules.response.repository.ResponseRepository;

@Service
@Transactional
public class ProjectService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ProjectService.class);

    private final ProjectRepository repository;
    private final ProjectShareRepository shareRepository;
    private final ResponseRepository responseRepository;

    public ProjectService(ProjectRepository repository,
                          ProjectShareRepository shareRepository,
                          ResponseRepository responseRepository) {
        this.repository = repository;
        this.shareRepository = shareRepository;
        this.responseRepository = responseRepository;
    }

    public Project create(CreateProjectRequest request, AuthenticatedAdmin user) {
        Long ownerId = user != null ? user.id() : null;
        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "project.forbidden");
        }
        Project project = new Project();
        project.setName(request.getName().trim());
        project.setResponsible(request.getResponsible().trim());
        project.setDescription(Optional.ofNullable(request.getDescription()).orElse(null));
        project.setLastPretriagemLevel(request.getLastPretriagemLevel());
        project.setLastPretriagemScore(request.getLastPretriagemScore() != null ? BigDecimal.valueOf(request.getLastPretriagemScore()) : null);
        project.setActive(true);
        project.setOwner(new Administrador() {{
            setId(ownerId);
        }});

        Project saved = repository.save(project);
        saved.setIsOwner(true);
        saved.setSharedWithMe(false);
        saved.setResponsesCount(0L);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Project> findAll(AuthenticatedAdmin user) {
        if (user == null || user.id() == null) {
            return List.of();
        }
        List<Project> projects = repository.findAccessible(user.id(), user.socialNumber());
        Map<Long, Long> finishedCounts = getFinishedCounts(projects);

        for (Project project : projects) {
            boolean isOwner = project.getOwner() != null && user.id().equals(project.getOwner().getId());
            boolean sharedWithMe = !isOwner && project.getOwner() != null && project.getOwner().getId() != null;
            project.setIsOwner(isOwner);
            project.setSharedWithMe(sharedWithMe);
            project.setResponsesCount(finishedCounts.getOrDefault(project.getId(), 0L));
        }
        return projects;
    }

    @Transactional(readOnly = true)
    public Project findOne(Long id, AuthenticatedAdmin user) {
        Project project = repository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "project.not_found"));
        ensureAccess(project, user, true);
        boolean isOwner = project.getOwner() != null && user.id().equals(project.getOwner().getId());
        boolean sharedWithMe = !isOwner && project.getOwner() != null && project.getOwner().getId() != null;
        project.setIsOwner(isOwner);
        project.setSharedWithMe(sharedWithMe);
        project.setResponsesCount(getFinishedCount(project.getId()));
        return project;
    }

    public Project update(Long id, UpdateProjectRequest request, AuthenticatedAdmin user) {
        Project project = ensureOwnerAccess(id, user);
        if (request.getName() != null) project.setName(request.getName().trim());
        if (request.getResponsible() != null) project.setResponsible(request.getResponsible().trim());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getLastPretriagemLevel() != null) project.setLastPretriagemLevel(request.getLastPretriagemLevel());
        if (request.getLastPretriagemScore() != null) project.setLastPretriagemScore(BigDecimal.valueOf(request.getLastPretriagemScore()));

        Project saved = repository.save(project);
        saved.setIsOwner(true);
        saved.setSharedWithMe(false);
        saved.setResponsesCount(getFinishedCount(saved.getId()));
        return saved;
    }

    public Map<String, Boolean> remove(Long id, AuthenticatedAdmin user) {
        Project project = ensureOwnerAccess(id, user);
        project.setActive(false);
        repository.save(project);
        return Map.of("success", Boolean.TRUE, "softDeleted", Boolean.TRUE);
    }

    @Transactional(readOnly = true)
    public List<ProjectShare> listShares(Long projectId, AuthenticatedAdmin user) {
        ensureOwnerAccess(projectId, user);
        return shareRepository.findByProjectIdOrderByDateCreatedAsc(projectId);
    }

    public ProjectShare addShare(Long projectId, ProjectShareRequest request, AuthenticatedAdmin user) {
        Project project = ensureOwnerAccess(projectId, user);
        String social = request.getSocialNumber().trim();
        if (social.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "project.share_invalid");
        }

        if (project.getOwner() != null && project.getOwner().getSocialNumber() != null) {
            if (project.getOwner().getSocialNumber().equals(social)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "project.share_invalid_owner");
            }
        }

        return shareRepository.findByProjectIdAndSocialNumber(projectId, social)
                .orElseGet(() -> {
                    ProjectShare share = new ProjectShare();
                    share.setProject(project);
                    share.setSocialNumber(social);
                    return shareRepository.save(share);
                });
    }

    public Map<String, Boolean> removeShare(Long projectId, Long shareId, AuthenticatedAdmin user) {
        ensureOwnerAccess(projectId, user);
        ProjectShare share = shareRepository.findById(shareId)
                .filter(s -> s.getProject() != null && projectId.equals(s.getProject().getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "project.share_not_found"));
        shareRepository.delete(share);
        return Map.of("success", Boolean.TRUE);
    }

    private Project ensureOwnerAccess(Long projectId, AuthenticatedAdmin user) {
        if (user == null || user.id() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "project.forbidden");
        }
        Project project = repository.findByIdAndActiveTrue(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "project.not_found"));
        if (project.getOwner() == null || !user.id().equals(project.getOwner().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "project.forbidden");
        }
        return project;
    }

    private void ensureAccess(Project project, AuthenticatedAdmin user, boolean allowShared) {
        if (user == null || user.id() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "project.forbidden");
        }
        if (project.getActive() != null && !project.getActive()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "project.not_found");
        }
        boolean isOwner = project.getOwner() != null && user.id().equals(project.getOwner().getId());
        boolean shared = false;
        if (allowShared && project.getShares() != null && user.socialNumber() != null) {
            shared = project.getShares().stream().anyMatch(s -> user.socialNumber().equals(s.getSocialNumber()));
        }
        if (!isOwner && !shared) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "project.forbidden");
        }
    }

    private Map<Long, Long> getFinishedCounts(List<Project> projects) {
        Map<Long, Long> map = new HashMap<>();
        List<Long> ids = projects.stream().map(Project::getId).toList();
        if (ids.isEmpty()) return map;
        responseRepository.countByProjectIdsAndStatus(ids, "FINISHED").forEach(row -> map.put(row.getProjectId(), row.getTotal()));
        return map;
    }

    private long getFinishedCount(Long projectId) {
        List<Long> ids = List.of(projectId);
        return responseRepository.countByProjectIdsAndStatus(ids, "FINISHED").stream()
                .findFirst().map(row -> row.getTotal()).orElse(0L);
    }
}
