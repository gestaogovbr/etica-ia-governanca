export type Campaigns = null | {
    id: string;
    title?: string;
    status?: string;
    questions?:Record<string, any>;
    deleted?: boolean;
    userCreated?: { id?: string; name?: string };
    userUpdated?: { id?: string; name?: string };
    startDate?: string;
    endDate?: string;
    createdAt?: string;
    updatedAt?: string;
};