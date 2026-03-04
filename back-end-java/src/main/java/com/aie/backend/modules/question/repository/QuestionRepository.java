package com.aie.backend.modules.question.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.aie.backend.modules.question.entities.Question;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByIdIn(Collection<Long> ids);

    @EntityGraph(attributePaths = {"session"})
    List<Question> findByActiveTrueOrderByOrderAscIdAsc();

    @EntityGraph(attributePaths = {"session"})
    Optional<Question> findByIdAndActiveTrue(Long id);
}
