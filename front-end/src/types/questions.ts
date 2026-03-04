export type Question = null | {
    id: string;
    description?: string;
    text?: string;
    total_points?: number;
    type?: "MULTIPLE_CHOICE" | "SINGLE_CHOICE" | "TEXT";
    requiredEvidence?: boolean;
    options?: Record<string, { text: string; percentage_points: number }>;
    deleted?: boolean;
    userCreated?: { id?: string; name?: string };
    userUpdated?: { id?: string; name?: string };
    createdAt?: string;
    updatedAt?: string;
};