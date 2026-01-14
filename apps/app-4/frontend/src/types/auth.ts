export type Role = "ADMIN" | "MEDICO" | "PACIENTE";

export interface User {
    id: number;
    email: string;
    fullName: string;
    phone?: string;
    specialty?: string;  // For doctors only
    crm?: string;        // Doctor's registration number
    role: Role;
    isActive: boolean;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    role: Role | null;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    loading: boolean;
}
