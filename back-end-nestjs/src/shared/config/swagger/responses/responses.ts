import { BadRequestExample, NotFoundExample } from "./errors"
import { rawProject } from "./projects"
import { fullQuestionWithSessionSchema } from "./questions"

const answerSchema = {
    question_id: { type: 'number' },
    value: { type: 'string' },
}

const metadataSchema = {
    advice: { type: 'string' },
    level_key: { type: 'string' },
    totalPoints: { type: 'number' },
    hasExcessiveTrigger: { type: 'boolean' },
    highRiskTriggerCount: { type: 'number' },
    questionnaireVersion: { type: 'string' },
    condicaoDadosSensiveisAltoImpacto: { type: 'boolean' }
}

const scoreSchema = {
    level: { type: 'string' },
    score: { type: 'number' },
    session_id: { type: 'number' },
    session_code: { type: 'string' },
    session_name: { type: 'string' },
}

const rawReponseSchema = {
    id: { type: 'number' },
    project_id: { type: 'number' },
    status: { type: 'string' },
    total_score: { type: 'string' },
    date_created: { type: 'string', format: 'date-time' },
    date_updated: { type: 'string', format: 'date-time' },
}

const fullAnswerSchema = {
    id: { type: 'number' },
    question: { type: 'object', properties: fullQuestionWithSessionSchema },
    question_id: { type: 'number' },
    value: { type: 'string' },
    value_parsed: { type: 'string' },
    points: { type: 'string' },
    date_created: { type: 'string', format: 'date-time' },
    date_updated: { type: 'string', format: 'date-time' },
}

const schemaResponseGet = {
    ...rawReponseSchema,
    answers: {
        type: 'array', items: {
            type: 'object',
            properties: fullAnswerSchema
        }
    },
    meta: { type: 'object', properties: { answeredQuestions: { type: 'number' } } },
    project: { type: 'object', properties: rawProject },
    result: { $ref: '#/components/schemas/Result', nullable: true },
    session_scores: {
        type: 'array', items: {
            type: 'object',
            properties: {
                ...scoreSchema,
                meta: { type: 'object', properties: metadataSchema }
            }
        }
    }
}

const ResponseCreateSuccess = {
    description: 'Response created successfully.',
    schema: {
        type: 'object',
        properties: {
            ...rawReponseSchema,
            answers: {
                type: 'array', items: {
                    type: 'object',
                    properties: fullAnswerSchema
                }
            },
            meta: { type: 'object', properties: { answeredQuestions: { type: 'number' } } },
            project: { type: 'object', properties: rawProject },
            session_scores: {
                type: 'array', items: {
                    type: 'object',
                    properties: {
                        ...scoreSchema,
                        meta: { type: 'object', properties: metadataSchema }
                    }
                }
            }
        }
    }
}

const ResponseGetSingleSuccess = {
    description: 'Response retrieved successfully.',
    schema: {
        type: 'object',
        properties: schemaResponseGet
    }
}

const ResponseGetMultipleSuccess = {
    description: 'Responses retrieved successfully.',
    schema: {
        type: 'array',
        items: {
            type: 'object',
            properties: schemaResponseGet
        }
    }
}

const ResponseNotFoundError = {
    description: 'Response not found',
    example: { ...NotFoundExample, message: 'response.not_found|question.not_found|project.not_found' }
}

const ResponseBadRequestError = {
    description: 'Response Bad Request Error',
    example: { ...BadRequestExample, message: 'response.project_mismatch|response.answers_required' }
}

export {
    ResponseCreateSuccess, ResponseNotFoundError, ResponseBadRequestError, ResponseGetSingleSuccess
    , ResponseGetMultipleSuccess
}



