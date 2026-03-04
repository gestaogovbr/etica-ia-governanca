package com.aie.backend.modules.classificationlevel.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aie.backend.modules.classificationlevel.entities.ClassificationLevel;

public interface ClassificationLevelRepository extends JpaRepository<ClassificationLevel, Long> {
    List<ClassificationLevel> findAllByOrderByDisplayOrderAsc();
}
