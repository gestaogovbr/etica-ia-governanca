package com.aie.backend.modules.project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aie.backend.modules.project.entities.ProjectShare;

public interface ProjectShareRepository extends JpaRepository<ProjectShare, Long> {

    List<ProjectShare> findByProjectIdOrderByDateCreatedAsc(Long projectId);

    Optional<ProjectShare> findByProjectIdAndSocialNumber(Long projectId, String socialNumber);
}
