package com.aie.backend.modules.session.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import com.aie.backend.modules.session.entities.Session;

public interface SessionRepository extends JpaRepository<Session, Long> {

    Optional<Session> findByCodeIgnoreCase(String code);

    List<Session> findByActiveTrueOrderByIdAsc();

    @EntityGraph(attributePaths = {"questions"})
    Optional<Session> findWithQuestionsById(Long id);
}
