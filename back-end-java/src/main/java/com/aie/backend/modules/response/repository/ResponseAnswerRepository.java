package com.aie.backend.modules.response.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.aie.backend.modules.response.entities.ResponseAnswer;

public interface ResponseAnswerRepository extends JpaRepository<ResponseAnswer, Long> {

    @Query(value = """
            select question_id as questionId, value as value, count(*) as total
            from response_answers ra
            join responses r on r.id = ra.response_id
            join projects p on p.id = r.project_id
            where ra.question_id is not null
              and coalesce(p.active, true) = true
            group by question_id, value
            order by question_id asc, total desc
            """, nativeQuery = true)
    List<QuestionValueCount> findGroupedByQuestion();

    @Modifying
    @Query("delete from ResponseAnswer a where a.response.id = :responseId and a.question.id in (:ids)")
    void deleteByResponseIdAndQuestionIds(Long responseId, List<Long> ids);

    @Query("select a from ResponseAnswer a join fetch a.question q join fetch q.session where a.response.id = :responseId")
    List<ResponseAnswer> findByResponseIdWithQuestion(Long responseId);

    interface QuestionValueCount {
        Long getQuestionId();
        String getValue();
        Long getTotal();
    }
}
