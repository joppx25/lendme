import { create } from "zustand";
import { Role, Status } from "@/generated/prisma";

export interface User {
    id: string;
    role: Role;
    name: string;
    email: string;
    phoneNo: string;
    address: string;
    dob: string;
    status: Status;
    activated: boolean;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
    isRole: (role: Role) => boolean;
    hasAnyRole: (roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    setUser: (user) => {
        // Use batch update to prevent multiple renders
        set((state) => ({ 
            ...state, 
            user, 
            isLoading: false 
        }));
    },
    setLoading: (isLoading) => {
        set((state) => ({ 
            ...state, 
            isLoading 
        }));
    },
    logout: () => {
        set((state) => ({ 
            ...state, 
            user: null, 
            isLoading: false 
        }));
    },
    isRole: (role) => {
        const state = get();
        return state.user?.role === role;
    },
    hasAnyRole: (roles) => {
        const state = get();
        const userRole = state.user?.role;
        return userRole ? roles.includes(userRole) : false;
    },
}));
