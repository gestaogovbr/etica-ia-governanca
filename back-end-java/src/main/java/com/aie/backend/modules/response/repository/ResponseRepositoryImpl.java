package com.aie.backend.modules.response.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Repository;

import com.aie.backend.modules.response.entities.Response;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;

@Repository
public class ResponseRepositoryImpl implements ResponseRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Response> findWithProjectAndResult(Long projectId, String status) {
        StringBuilder jpql = new StringBuilder("select distinct r from Response r join fetch r.project p left join fetch p.owner o left join fetch r.result res");
        Map<String, Object> params = new HashMap<>();
        List<String> predicates = new ArrayList<>();

        predicates.add("coalesce(p.active, true) = true");

        if (projectId != null) {
            predicates.add("p.id = :projectId");
            params.put("projectId", projectId);
        }
        if (status != null) {
            predicates.add("upper(r.status) = :status");
            params.put("status", status.toUpperCase());
        }
        if (!predicates.isEmpty()) {
            jpql.append(" where ").append(String.join(" and ", predicates));
        }
        jpql.append(" order by r.dateCreated desc");

        TypedQuery<Response> query = entityManager.createQuery(jpql.toString(), Response.class);
        params.forEach(query::setParameter);
        return query.getResultList();
    }
}
