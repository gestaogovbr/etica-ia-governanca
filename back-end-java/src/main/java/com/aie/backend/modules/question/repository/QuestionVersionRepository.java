package com.aie.backend.modules.question.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.aie.backend.modules.question.entities.QuestionVersion;

public interface QuestionVersionRepository extends JpaRepository<QuestionVersion, Long> {

    @EntityGraph(attributePaths = {"session"})
    List<QuestionVersion> findByQuestionIdOrderByVersionDescIdDesc(Long questionId);
}
