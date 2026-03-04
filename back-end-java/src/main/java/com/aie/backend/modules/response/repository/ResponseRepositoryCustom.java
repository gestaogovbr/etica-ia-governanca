package com.aie.backend.modules.response.repository;

import java.util.List;

import com.aie.backend.modules.response.entities.Response;

public interface ResponseRepositoryCustom {

    List<Response> findWithProjectAndResult(Long projectId, String status);
}
