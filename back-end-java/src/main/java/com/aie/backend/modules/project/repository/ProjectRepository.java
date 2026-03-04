package com.aie.backend.modules.project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.aie.backend.modules.project.entities.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("""
            select distinct p from Project p
            left join fetch p.owner o
            left join p.shares s
            where coalesce(p.active, true) = true
              and (
                p.owner.id = :ownerId
                or (s.socialNumber = :socialNumber)
              )
            """)
    List<Project> findAccessible(Long ownerId, String socialNumber);

    @Query("select count(p) from Project p where coalesce(p.active, true) = true")
    long countActive();

    @Query("select p from Project p left join fetch p.owner o where p.id = :id and coalesce(p.active, true) = true")
    java.util.Optional<Project> findByIdAndActiveTrue(Long id);
}
