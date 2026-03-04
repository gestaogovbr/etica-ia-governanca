package com.aie.backend.modules.classificationlevel.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.aie.backend.modules.classificationlevel.dto.CreateClassificationLevelRequest;
import com.aie.backend.modules.classificationlevel.dto.UpdateClassificationLevelRequest;
import com.aie.backend.modules.classificationlevel.entities.ClassificationLevel;
import com.aie.backend.modules.classificationlevel.repository.ClassificationLevelRepository;

@Service
@Transactional
public class ClassificationLevelService {

    private final ClassificationLevelRepository repository;

    public ClassificationLevelService(ClassificationLevelRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ClassificationLevel> findAll() {
        return repository.findAllByOrderByDisplayOrderAsc();
    }

    public ClassificationLevel create(CreateClassificationLevelRequest request) {
        ClassificationLevel level = new ClassificationLevel();
        level.setLevelKey(request.getLevelKey());
        level.setDisplayOrder(request.getDisplayOrder() == null ? 0 : request.getDisplayOrder());
        level.setTitle(request.getTitle());
        level.setSubtitle(request.getSubtitle());
        level.setDescription(request.getDescription());
        level.setAdvice(request.getAdvice());
        level.setMaxScore(request.getMaxScore());
        level.setMaxPercentage(request.getMaxPercentage());
        level.setCriticalTriggerThreshold(request.getCriticalTriggerThreshold());
        return repository.save(level);
    }

    public ClassificationLevel update(Long id, UpdateClassificationLevelRequest request) {
        ClassificationLevel level = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "classification_level.not_found"));
        if (request.getLevelKey() != null) level.setLevelKey(request.getLevelKey());
        if (request.getDisplayOrder() != null) level.setDisplayOrder(request.getDisplayOrder());
        if (request.getTitle() != null) level.setTitle(request.getTitle());
        if (request.getSubtitle() != null) level.setSubtitle(request.getSubtitle());
        if (request.getDescription() != null) level.setDescription(request.getDescription());
        if (request.getAdvice() != null) level.setAdvice(request.getAdvice());
        if (request.getMaxScore() != null) level.setMaxScore(request.getMaxScore());
        if (request.getMaxPercentage() != null) level.setMaxPercentage(request.getMaxPercentage());
        if (request.getCriticalTriggerThreshold() != null) level.setCriticalTriggerThreshold(request.getCriticalTriggerThreshold());
        return repository.save(level);
    }

    public void remove(Long id) {
        ClassificationLevel level = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "classification_level.not_found"));
        repository.delete(level);
    }
}
