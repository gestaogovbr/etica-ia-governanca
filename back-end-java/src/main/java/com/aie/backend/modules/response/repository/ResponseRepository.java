package com.aie.backend.modules.response.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.aie.backend.modules.response.entities.Response;

public interface ResponseRepository extends JpaRepository<Response, Long>, ResponseRepositoryCustom {

    @Query("select count(r) from Response r join r.project p where coalesce(p.active, true) = true")
    long countByProjectActiveTrue();

    @Query("select count(r) from Response r join r.project p where upper(r.status) = upper(:status) and coalesce(p.active, true) = true")
    long countByStatusIgnoreCaseAndProjectActiveTrue(String status);

    @Query("select r.status as status, count(r) as total from Response r join r.project p where coalesce(p.active, true) = true group by r.status")
    List<StatusCount> countGroupByStatus();

    @Query("select r.project.id as projectId, count(r) as total from Response r join r.project p where upper(r.status) = upper(:status) and coalesce(p.active, true) = true and r.project.id in :projectIds group by r.project.id")
    List<ProjectStatusCount> countByProjectIdsAndStatus(Iterable<Long> projectIds, String status);

    @Query("""
            select r from Response r
            join fetch r.project p
            left join fetch p.owner o
            left join fetch r.answers a
            left join fetch a.question q
            left join fetch q.session s
            left join fetch r.result res
            where r.id = :id and coalesce(p.active, true) = true
            """)
    Response findDetailById(Long id);

    interface StatusCount {
        String getStatus();
        Long getTotal();
    }

    interface ProjectStatusCount {
        Long getProjectId();
        Long getTotal();
    }
}
