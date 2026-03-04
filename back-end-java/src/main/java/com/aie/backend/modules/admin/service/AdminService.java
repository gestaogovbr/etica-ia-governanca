package com.aie.backend.modules.admin.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.aie.backend.modules.admin.dto.AdminResponse;
import com.aie.backend.modules.admin.dto.CreateAdminRequest;
import com.aie.backend.modules.admin.dto.UpdateAdminRequest;
import com.aie.backend.modules.admin.repository.AdminRepository;
import com.aie.backend.modules.auth.entities.Administrador;

import org.springframework.security.crypto.password.PasswordEncoder;

@Service
@Transactional
public class AdminService {

    private final AdminRepository repository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(AdminRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public AdminResponse create(CreateAdminRequest request) {
        String email = normalizeEmail(request.getEmail());
        String socialNumber = normalize(request.getSocialNumber());

        repository.findByEmailIgnoreCaseOrSocialNumber(email, socialNumber)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "admin.social_number_duplicate");
                });

        Administrador admin = new Administrador();
        admin.setName(request.getName().trim());
        admin.setSocialNumber(socialNumber);
        admin.setEmail(email);
        admin.setPosition(normalizeNullable(request.getPosition()));
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setActive(request.getActive() == null ? Boolean.TRUE : request.getActive());
        admin.setLastAccess(null);

        Administrador saved = repository.save(admin);
        return AdminResponse.fromEntity(saved);
    }

    public AdminResponse update(Long id, UpdateAdminRequest request) {
        Administrador admin = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "admin.not_found"));

        if (request.getEmail() != null) {
            String email = normalizeEmail(request.getEmail());
            if (repository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "social_number_email_em_uso");
            }
            admin.setEmail(email);
        }

        if (request.getSocialNumber() != null) {
            String social = normalize(request.getSocialNumber());
            if (repository.existsBySocialNumberAndIdNot(social, id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "social_number_email_em_uso");
            }
            admin.setSocialNumber(social);
        }

        if (request.getName() != null) {
            admin.setName(request.getName().trim());
        }

        if (request.getPosition() != null) {
            admin.setPosition(normalizeNullable(request.getPosition()));
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            admin.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getActive() != null) {
            admin.setActive(request.getActive());
        }

        Administrador updated = repository.save(admin);
        return AdminResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public List<AdminResponse> findAll() {
        return repository.findByActiveTrueOrderByIdDesc()
                .stream()
                .map(AdminResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminResponse findOne(Long id) {
        Administrador admin = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "admin_nao_encontrado"));
        return AdminResponse.fromEntity(admin);
    }

    public AdminResponse softDelete(Long id) {
        Administrador admin = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "admin_nao_encontrado"));

        if (Boolean.FALSE.equals(admin.getActive())) {
            return AdminResponse.fromEntity(admin);
        }

        admin.setActive(Boolean.FALSE);
        Administrador updated = repository.save(admin);
        return AdminResponse.fromEntity(updated);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeNullable(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
