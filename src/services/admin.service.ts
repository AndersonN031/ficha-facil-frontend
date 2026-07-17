import { api } from "@/lib/api";
import { HealthUnit } from "@/types/healthUnit";
import { DailyReport } from "@/types/reports";
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

  async getHealthUnit(
    unitId: string,
    accessToken: string,
  ): Promise<HealthUnit> {
    const { data } = await api.get<HealthUnit>(`/health-units/${unitId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data;
  },

  // dentro do objeto adminService:
  async getDailyReport(
    date: string,
    accessToken: string,
  ): Promise<DailyReport> {
    const { data } = await api.get<DailyReport>(`/reports/daily?date=${date}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data;
  },

  async updateHealthUnit(
    unitId: string,
    payload: HealthUnit,
    accessToken: string,
  ): Promise<HealthUnit> {
    const { data } = await api.put<HealthUnit>(
      `/health-units/${unitId}`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return data;
  },
};
