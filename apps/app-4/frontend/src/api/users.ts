import { axiosInstance } from "./axios";
import { User } from "@/types/auth";

export const usersAPI = {
    listUsers: async (role?: string, page: number = 1, pageSize: number = 10) => {
        const response = await axiosInstance.get<User[]>("/admin/users", {
            params: { role, page, pageSize },
        });
        return response.data;
    },

    getUser: async (userId: number) => {
        const response = await axiosInstance.get<User>(`/users/${userId}`);
        return response.data;
    },

    createUser: async (user: Partial<User>) => {
        const response = await axiosInstance.post<User>("/admin/users", user);
        return response.data;
    },

    updateUser: async (userId: number, user: Partial<User>) => {
        const response = await axiosInstance.put<User>(`/users/${userId}`, user);
        return response.data;
    },

    deleteUser: async (userId: number) => {
        const response = await axiosInstance.delete(`/users/${userId}`);
        return response.data;
    },

    listDoctors: async () => {
        const response = await axiosInstance.get<User[]>("/doctors");
        return response.data;
    },

    deleteMyAccount: async (password: string, reason?: string) => {
        const response = await axiosInstance.delete("/users/me/account", {
            data: { password, reason }
        });
        return response.data;
    },
};
