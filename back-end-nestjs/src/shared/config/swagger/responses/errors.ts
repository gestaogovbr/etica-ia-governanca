// Errors

const InternalServerError = {
    description: 'Internal server error',
    example: { statusCode: 500, message: 'Internal server error' }
}

const UnauthorizedError = {
    description: 'Unauthorized',
    example: { statusCode: 401, error: 'Unauthorized' }
}

const UnauthorizedWithMessageError = {
    description: 'Unauthorized',
    example: { statusCode: 401, message: 'login.invalid', error: 'Unauthorized' }
}

const NotFoundExample = {
    statusCode: 404,
    error: 'Not Found'
}

const ForbiddenExample = {
    statusCode: 403,
    error: 'Forbidden'
}

const ConflictExample = {
    statusCode: 409,
    error: 'Conflict'
}

const BadRequestExample = {
    statusCode: 400,
    error: 'Bad Request'
}

export { InternalServerError, UnauthorizedError, UnauthorizedWithMessageError, NotFoundExample, ForbiddenExample, ConflictExample, BadRequestExample };