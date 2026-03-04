// Login

const LoginSuccess = {
    description: 'Successful login',
    schema: {
        type: 'object',
        properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/Administrador' }
        }
    }
};

const LoginProfileSuccess = {
    description: 'Successful profile retrieval',
    schema: {
        type: 'object',
        properties: {
            "id": { type: 'number' },
            "email": { type: 'string' },
            "name": { type: 'string' },
            "social_number": { type: 'string' },
            "admin": { type: 'boolean' },
            "menu": {
                type: 'array', items: {
                    type: 'object', properties: {
                        icon: { type: 'string' },
                        id: { type: 'string' },
                        name: { type: 'string' },
                        order: { type: 'number' },
                        path: { type: 'string' },
                    }
                }
            }
        }
    }
};

const LoginGovbrSuccess = {
    description: 'Successful Gov.br login',
    schema: {
        type: 'object',
        properties: {
            token: { type: 'string' },
            user: {
                allOf: [
                    { $ref: '#/components/schemas/Administrador' },
                    {
                        type: 'object',
                        properties: {
                            gov_token_received: { type: 'string' }
                        }
                    }
                ]
            }
        }
    }
};

// Dashboards
const DashboardSuccess = {
    description: 'Successful dashboard retrieval',
    schema: {
        type: 'object',
        properties: {
            overview: {
                totalProjects: { type: 'number' },
                totalResponses: { type: 'number' },
                finishedResponses: { type: 'number' },
            },
            statusBreakdown: {
                type: 'array', items: {
                    type: 'object', properties: {
                        status: { type: 'string' },
                        count: { type: 'number' },
                    }
                }
            },
            sessionAverages: {
                type: 'array', items: {
                    type: 'object',
                    properties: {
                        session_id: { type: 'number' },
                        session_name: { type: 'string' },
                        average_score: { type: 'number' },
                        responses: { type: 'number' },
                    }
                }
            },
            answerLeaders: {
                type: 'array', items: {
                    type: 'object',
                    properties: {
                        question_id: { type: 'number' },
                        question_text: { type: 'string' },
                        value: { type: 'string', nullable: true },
                        count: { type: 'number' },
                    }
                }
            }
        }
    }
};

const LogsGetSuccess = {
    description: 'Logs retrieved successfully.',
    schema: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'number', },
                user_id: { type: 'number', },
                user_email: { type: 'string' },
                ip: { type: 'string' },
                action: { type: 'string' },
                module: { type: 'string' },
                record_id: { type: 'string' },
                route: { type: 'string' },
                method: { type: 'string' },
                status: { type: 'string' },
                user_agent: { type: 'string' },
                date_created: { type: 'string' },
                detail: {
                    type: 'object',
                    properties: {
                        request: {
                            type: 'object',
                            example: {
                                body: { exampleField: 'exampleValue' },
                                query: { exampleParam: 'exampleValue' },
                            }
                        },
                        response: {
                            type: 'object',
                            example: {
                                exampleField: 'exampleValue'
                            }
                        }
                    }
                }
            }
        }
    }
}


export { LoginSuccess, LoginProfileSuccess, LoginGovbrSuccess, DashboardSuccess, LogsGetSuccess };