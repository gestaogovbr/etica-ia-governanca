import { ConflictExample, NotFoundExample } from "./errors";

const adminRaw = {
    name: { type: "string" },
    social_number: { type: "string" },
    position: { type: "string" },
    email: { type: "string", format: "email" },
}

const adminFull = {
    id: { type: "number" },
    ...adminRaw,
    date_created: { type: "string", format: "date-time" },
    date_updated: { type: "string", format: "date-time" },
    last_access: { type: "string", format: "date-time", nullable: true },
}

const createAdminDto = {
    type: 'object',
    properties: {
        ...adminRaw,
        password: { type: "string" },
    }
}

const schema = {
    type: 'object',
    properties: adminFull
}

const AdminCreateSuccess = {
    description: 'Admin created successfully.',
    schema
}

const AdminGetSingleSuccess = {
    description: 'Admin retrieved successfully.',
    schema
}

const AdminUpdateSuccess = {
    description: 'Admin updated successfully.',
    schema
}

const AdminDeleteSuccess = {
    description: 'Admin deleted successfully.',
    schema
}

const AdminGetMultipleSuccess = {
    description: 'Admins retrieved successfully.',
    schema: {
        type: 'array',
        items: schema
    }
}

const AdminConflicError = {
    description: 'Admin conflic error',
    example: { ...ConflictExample, message: 'admin.social_number_duplicate' }
}

const AdminConflicErrorPut = {
    description: 'Admin conflic error',
    example: { ...ConflictExample, message: 'social_number_email_em_uso' }
}

const AdminNotFoundError = {
    description: 'Admin not found',
    example: { ...NotFoundExample, message: 'admin.not_found' }
}

const AdminNotFoundOneError = {
    description: 'Admin not found',
    example: { ...NotFoundExample, message: 'admin_nao_encontrado' }
}

export {
    createAdminDto, AdminConflicError, AdminCreateSuccess, AdminGetSingleSuccess,
    AdminGetMultipleSuccess, AdminNotFoundError, AdminConflicErrorPut,
    AdminUpdateSuccess, AdminDeleteSuccess, AdminNotFoundOneError
};