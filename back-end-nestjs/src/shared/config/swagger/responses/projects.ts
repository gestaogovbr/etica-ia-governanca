import { response } from "express";
import { ForbiddenExample, NotFoundExample } from "./errors";

const rawProject = {
    id: { type: "number" },
    name: { type: "string" },
    responsible: { type: "string" },
    description: { type: "string" },
    last_pretriagem_level: { type: "string", nullable: true },
    last_pretriagem_score: { type: "number", nullable: true },
    active: { type: "boolean" },
    // owner_id: { type: "number" },
    date_created: { type: "string", format: "date-time" },
    date_updated: { type: "string", format: "date-time" }
}

const extraFieldsForProject = {
    is_owner: { type: "boolean" },
    last_pretraigem_level: { type: "string", nullable: true },
    last_pretriagem_score: { type: "number", nullable: true },
    responses_count: { type: "number" },
    responsible: { type: "string" },
    shared_with_me: { type: "boolean" }
}

const getProjectProperties = {
    type: 'object',
    properties: {
        ...rawProject,
        ...extraFieldsForProject,
        owner: { $ref: '#/components/schemas/Administrador' }
    }
}

const ProjectGetMultipleSuccess = {
    description: 'Projects retrieved successfully.',
    schema: {
        type: 'array',
        items: {
            ...getProjectProperties
        }
    }
};

const ProjectGetSingleSuccess = {
    description: 'Project retrieved successfully.',
    schema: getProjectProperties
};


const ProjectCreateSuccess = {
    description: 'Project created successfully.',
    schema: {
        type: 'object',
        properties: {
            ...rawProject,
            owner_id: { type: "number" },
            owner: {
                type: "object",
                properties: {
                    id: { type: "number" }
                }
            },
        }
    }
};

const ProjectUpdateSuccess = {
    description: 'Project updated successfully.',
    schema: {
        type: 'object',
        properties: {
            ...rawProject,
            owner_id: { type: "number" },
        }
    }
};

const ProjectDeleteSuccess = {
    description: 'Project deleted successfully.',
    schema: {
        type: 'object',
        properties: {
            "success": { type: "boolean", example: true },
            "softDeleted": { type: "boolean", example: true }
        }
    }
}

// Shares

const rawProjectShare = {
    id: { type: "number" },
    social_number: { type: "string" },
    date_created: { type: "string", format: "date-time" },
    date_updated: { type: "string", format: "date-time" }
}

const ProjectShareCreateSuccess = {
    description: 'Project share created successfully.',
    schema: {
        type: 'object',
        properties: {
            ...rawProjectShare,
            project: {
                type: "object",
                properties: {
                    ...rawProject,
                    owner: { $ref: '#/components/schemas/Administrador' }
                }
            }
        }
    }
}

const ProjectShareGetSuccess = {
    description: 'Project share retrieved successfully.',
    schema: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                ...rawProjectShare
            }
        }
    }
}

const ProjectShareDeleteSuccess = {
    description: 'Project share deleted successfully.',
    schema: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true }
        }
    }
}

const ProjectNotFoundError = {
    description: 'Project not found',
    example: { ...NotFoundExample, message: 'project.not_found' }
}

const ProjectForbiddenError = {
    description: 'Forbidden',
    example: { ...ForbiddenExample, message: 'project.access_forbidden' }
}

export {
    ProjectGetMultipleSuccess, ProjectGetSingleSuccess, ProjectCreateSuccess,
    ProjectUpdateSuccess, ProjectDeleteSuccess,
    ProjectNotFoundError, ProjectForbiddenError,
    ProjectShareGetSuccess, ProjectShareCreateSuccess, ProjectShareDeleteSuccess,
    rawProject
};