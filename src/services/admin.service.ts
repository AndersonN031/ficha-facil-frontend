import { api } from "@/lib/api";
import { User } from "@/types/user";

export const adminService = {
  async listUsers(unitId: string, accessToken: string): Promise<User[]> {
    const { data } = await api.get<User[]>(`/users/${unitId}/list-users`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data;
  },

  async manageUser(
    userId: string,
    payload: { role?: string; healthUnitId?: string | null; active?: boolean },
    accessToken: string,
  ): Promise<User> {
    const { data } = await api.patch<User>(`/users/${userId}/manage`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data;
  },
};
