package com.aie.backend.modules.actor.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aie.backend.modules.actor.entities.Actor;

public interface ActorRepository extends JpaRepository<Actor, Long> {

    List<Actor> findAllByOrderByNameAsc();

    List<Actor> findByActiveOrderByNameAsc(Boolean active);
}
