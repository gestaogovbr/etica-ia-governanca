package com.aie.backend.modules.result.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.aie.backend.modules.project.entities.Project;
import com.aie.backend.modules.response.entities.Response;
import com.aie.backend.modules.response.repository.ResponseRepository;
import com.aie.backend.modules.result.dto.UpsertResultRequest;
import com.aie.backend.modules.result.entities.Result;
import com.aie.backend.modules.result.repository.ResultRepository;

@Service
@Transactional
public class ResultService {

    private final ResultRepository resultRepository;
    private final ResponseRepository responseRepository;

    public ResultService(ResultRepository resultRepository, ResponseRepository responseRepository) {
        this.resultRepository = resultRepository;
        this.responseRepository = responseRepository;
    }

    public Result upsert(UpsertResultRequest request) {
        Response response = responseRepository.findById(request.getResponseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "response.not_found"));
        Project project = response.getProject();
        if (project != null && Boolean.FALSE.equals(project.getActive())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "project.not_found");
        }

        Result entity = resultRepository.findByResponseId(response.getId()).orElse(null);
        if (entity == null) {
            entity = new Result();
            entity.setResponse(response);
        }
        entity.setProject(response.getProject());
        entity.setSummary(request.getSummary());

        return resultRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public Result findByResponse(Long responseId) {
        Result result = resultRepository.findByResponseId(responseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "result.not_found"));
        if (result.getProject() != null && Boolean.FALSE.equals(result.getProject().getActive())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "result.not_found");
        }
        return result;
    }
}
