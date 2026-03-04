package com.aie.backend.modules.admin.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aie.backend.modules.auth.entities.Administrador;

public interface AdminRepository extends JpaRepository<Administrador, Long> {

    Optional<Administrador> findByEmailIgnoreCase(String email);

    Optional<Administrador> findByEmailIgnoreCaseOrSocialNumber(String email, String socialNumber);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    boolean existsBySocialNumberAndIdNot(String socialNumber, Long id);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsBySocialNumber(String socialNumber);

    List<Administrador> findByActiveTrueOrderByIdDesc();
}
