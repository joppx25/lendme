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
    setUser: (user) => set({ user, isLoading: false }),
    setLoading: (isLoading) => set({ isLoading }),
    logout: () => set({ user: null, isLoading: false }),
    isRole: (role) => get().user?.role === role,
    hasAnyRole: (roles) => {
        const userRole = get().user?.role;
        return userRole ? roles.includes(userRole) : false;
    },
}));
