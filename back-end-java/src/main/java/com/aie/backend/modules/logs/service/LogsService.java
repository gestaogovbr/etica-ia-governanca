package com.aie.backend.modules.logs.service;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.aie.backend.modules.logs.dto.LogsQuery;
import com.aie.backend.modules.logs.entities.LogEntry;
import com.aie.backend.modules.logs.repository.LogRepository;

@Service
@Transactional
public class LogsService {

    private static final Logger LOGGER = LoggerFactory.getLogger(LogsService.class);

    private final LogRepository repository;

    public LogsService(LogRepository repository) {
        this.repository = repository;
    }

    public void write(LogEvent event) {
        try {
            LogEntry entry = new LogEntry();
            entry.setUserId(event.userId());
            entry.setUserEmail(event.userEmail());
            entry.setIp(event.ip());
            entry.setAction(event.action());
            entry.setModule(event.module());
            entry.setRecordId(event.recordId());
            entry.setRoute(event.route());
            entry.setMethod(event.method());
            entry.setStatus(event.status());
            entry.setDetail(event.detail());
            entry.setUserAgent(event.userAgent());
            repository.save(entry);
        } catch (Exception ex) {
            LOGGER.warn("Failed to persist log entry: {}", ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public java.util.List<LogEntry> search(LogsQuery query) {
        int limit = normalizeLimit(query.getLimit());
        Long userId = parseUserId(query.getUser());
        String userEmail = parseUserEmail(query.getUser());
        Instant from = parseInstant(query.getFrom(), "from");
        Instant to = parseInstant(query.getTo(), "to");

        Specification<LogEntry> spec = Specification.where(null);

        if (userEmail != null) {
            spec = spec.and((root, cq, cb) -> cb.like(cb.lower(root.get("userEmail")), "%" + userEmail + "%"));
        }
        if (userId != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("userId"), userId));
        }
        if (query.getRoute() != null && !query.getRoute().isBlank()) {
            String route = query.getRoute().trim().toLowerCase();
            spec = spec.and((root, cq, cb) -> cb.like(cb.lower(root.get("route")), "%" + route + "%"));
        }
        if (query.getAction() != null && !query.getAction().isBlank()) {
            String action = query.getAction().trim();
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("action"), action));
        }
        if (query.getModule() != null && !query.getModule().isBlank()) {
            String module = query.getModule().trim();
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("module"), module));
        }
        if (from != null && to != null) {
            spec = spec.and((root, cq, cb) -> cb.between(root.get("dateCreated"), from, to));
        } else if (from != null) {
            spec = spec.and((root, cq, cb) -> cb.greaterThanOrEqualTo(root.get("dateCreated"), from));
        } else if (to != null) {
            spec = spec.and((root, cq, cb) -> cb.lessThanOrEqualTo(root.get("dateCreated"), to));
        }

        Sort sort = Sort.by(Sort.Order.desc("dateCreated"), Sort.Order.desc("id"));
        return repository.findAll(spec, PageRequest.of(0, limit, sort)).getContent();
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null) {
            return 100;
        }
        return Math.min(Math.max(limit, 1), 500);
    }

    private Long parseUserId(String user) {
        if (user == null || user.isBlank() || user.contains("@")) {
            return null;
        }
        try {
            return Long.parseLong(user.trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String parseUserEmail(String user) {
        if (user == null || user.isBlank() || !user.contains("@")) {
            return null;
        }
        return user.trim().toLowerCase();
    }

    private Instant parseInstant(String value, String field) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "logs.invalid_" + field);
        }
    }
}
