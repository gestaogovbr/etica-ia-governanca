import { ConflictExample, NotFoundExample } from "./errors";

const rawSession = {
    type: "object",
    properties: {
        active: { type: "boolean" },
        code: { type: "string" },
        description: { type: "string" },
        ethical_principles: { type: "string" },
        is_testing: { type: "boolean" },
        is_triage: { type: "boolean" },
        name: { type: "string" },
        next_session_code: { type: 'string', nullable: true },
        priority: { type: "number" },
    }
}

const sessionLevel = {
    type: "object",
    properties: {
        key: { type: "string" },
        label: { type: "string" },
        min_score: { type: "number" },
        next_session_code: { type: "string" },
    }
}

const fullSession = {
    ...rawSession.properties,
    triage_config: {
        type: "object",
        properties: {
            levels: {
                type: "array",
                items: sessionLevel
            }
        },
        nullable: true
    }
}

const schema = {
    type: 'object',
    properties: fullSession
}

const SessionCreateSuccess = {
    description: 'Session created successfully.',
    schema
};

const SessionGetSingleSuccess = {
    description: 'Session retrieved successfully.',
    schema
};

const SessionGetMultipleSuccess = {
    description: 'Sessions retrieved successfully.',
    schema: {
        type: 'array',
        items: {
            type: 'object',
            properties: fullSession
        }
    }
};

const SessionUpdateSuccess = {
    description: 'Session updated successfully.',
    schema
};

const SessionDeleteSuccess = {
    description: 'Session deleted successfully.',
    schema
};


const SessionNotFoundError = {
    description: 'Session not found',
    example: { ...NotFoundExample, message: 'session.not_found' }
}

const SessionConflictError = {
    description: 'Conflict with existing session',
    example: { ...ConflictExample, message: 'session.code_exists' }
}


export {
    SessionCreateSuccess, SessionGetMultipleSuccess,
    SessionGetSingleSuccess,
    SessionUpdateSuccess, SessionDeleteSuccess,
    SessionNotFoundError, SessionConflictError,
    fullSession
}