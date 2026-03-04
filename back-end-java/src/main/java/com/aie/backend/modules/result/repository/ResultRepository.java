package com.aie.backend.modules.result.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aie.backend.modules.result.entities.Result;

public interface ResultRepository extends JpaRepository<Result, Long> {

    Optional<Result> findByResponseId(Long responseId);

    @org.springframework.data.jpa.repository.Query("select r from Result r join r.project p where coalesce(p.active, true) = true")
    java.util.List<Result> findAllByProjectActiveTrue();
}
