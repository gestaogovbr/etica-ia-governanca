package com.aie.backend.modules.logs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.aie.backend.modules.logs.entities.LogEntry;

public interface LogRepository extends JpaRepository<LogEntry, Long>, JpaSpecificationExecutor<LogEntry> {
}
