import { BadRequestExample, NotFoundExample } from "./errors";

const ClassificationNotFoundError = {
    description: 'Classification not found.',
    example: { ...NotFoundExample, message: 'classification.not_found' }
}

const ClassificationBadRequestError = {
    description: 'Bad request for classification.',
    example: { ...BadRequestExample, message: ["Error message"] }
} 

const ClassificacaoDeletedSuccess = {
    description: 'Classification deleted successfully.',
    schema: {
        type: 'object',
        properties: {
            deleted: { type: 'boolean', example: true }
        }
    }
}

export { ClassificationNotFoundError, ClassificationBadRequestError, ClassificacaoDeletedSuccess };