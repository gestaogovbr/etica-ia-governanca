import { NotFoundExample } from "./errors";
import { fullSession } from "./sessions";

const optionSchema = {
    text: { type: 'string' },
    value: { type: 'string' },
    score: { type: "number", nullable: true },
    points: { type: "number", nullable: true },
    points_per_selection: { type: "number", nullable: true },
    trigger: { type: "string", nullable: true },
    trigger_if_selected: { type: "string", nullable: true },
    best_practice_description: { type: "string", nullable: true },
    recommendation_if_chosen_and_suboptimal: { type: "string", nullable: true },
    reason_if_negative: { type: "string", nullable: true },
    reason_if_selected: { type: "string", nullable: true },
    recommendation_if_selected: { type: "string", nullable: true },
};

const actorSchema = { type: 'string' };

const fullQuestionSchema = {
    "session_id": { type: "string", },
    "text": { type: "string" },
    "type": { type: "string" },
    "code": { type: "string" },
    "weights": { type: "number" },
    "order": { type: "number", nullable: true },
    "options": {
        type: 'array', items: {
            type: 'object',
            properties: optionSchema
        }
    },
    "is_critical": { type: "boolean" },
    "conditional_value": { type: "string", nullable: true },
    "conditional_field": { type: "string", nullable: true },
    "active": { type: "boolean" },
    "actors": { type: 'array', items: actorSchema }
}

const fullQuestionWithSessionSchema = {
    ...fullQuestionSchema,
    session: {
        type: 'object',
        properties: fullSession
    }
};

const QuestionCreateSuccess = {
    description: 'Question created successfully.',
    schema: {
        type: 'object',
        properties: fullQuestionSchema
    }
};

const QuestionGetMultipleSuccess = {
    description: 'Questions retrieved successfully.',
    schema: {
        type: 'array',
        items: {
            type: 'object',
            properties: fullQuestionSchema
        }
    }
};  

const QuestionGetMultipleWithSessionSuccess = {
    description: 'Questions retrieved successfully.',
    schema: {
        type: 'array',
        items: {
            type: 'object',
            properties: fullQuestionWithSessionSchema
        }
    }
}; 

const QuestionGetSingleSuccess = {
    description: 'Question retrieved successfully.',
    schema: {
        type: 'object',
        properties: fullQuestionWithSessionSchema
    }
};

const QuestionPutSuccess = {
    description: 'Question updated successfully.',
    schema: {
        type: 'object',
        properties: fullQuestionWithSessionSchema
    }
};

const QuestionDeleteSuccess = {
    description: 'Question deleted successfully.',
    schema: {
        type: 'object',
        properties: fullQuestionWithSessionSchema
    }
};


const QuestionNotFoundError = {
    description: 'Question not found',
    example: { ...NotFoundExample, message: 'question.not_found' }
}

export { 
    QuestionCreateSuccess, fullQuestionSchema, QuestionGetMultipleSuccess ,
    QuestionPutSuccess, QuestionDeleteSuccess, QuestionGetSingleSuccess,
    QuestionGetMultipleWithSessionSuccess,
    QuestionNotFoundError, fullQuestionWithSessionSchema
};