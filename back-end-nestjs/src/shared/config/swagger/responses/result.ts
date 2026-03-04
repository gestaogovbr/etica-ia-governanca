import { NotFoundExample } from "./errors";

const ResultCreateNotFoundError = {
    description: 'Result not found.',
    example: { ...NotFoundExample, message: 'esponse.not_found|project.not_found' }
}

const resultDtoSchema = {
    type: 'object',
    example: {
        response_id: 0,
        summary: {
            someProperty: "someValue"
        }
    }
}
export { ResultCreateNotFoundError, resultDtoSchema };