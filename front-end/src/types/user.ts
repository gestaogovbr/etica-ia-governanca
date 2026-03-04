export interface UserSistem {
    active?: boolean;
    admin?: boolean;
    id: string;
    name: string;
    social_number: string;
    email: string;
    role: string[];
    position?: string;
    password?: string;
    date_created?: string;
    last_access?: string;
    date_updated?: string;
}

export type User = UserSistem | null;
