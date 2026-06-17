import { api } from "@/lib/api";
import { Ticket } from "@/types/ticket";

export const doctorService = {
  async getTodayTickets(accessToken: string): Promise<Ticket[]> {
    const { data } = await api.get<Ticket[]>("/tickets/doctor/today", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data;
  },

  async startTreatment(ticketId: string, accessToken: string): Promise<Ticket> {
    const { data } = await api.patch<Ticket>(
      `/tickets/${ticketId}/start`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return data;
  },

  async completeTreatment(
    ticketId: string,
    accessToken: string,
  ): Promise<Ticket> {
    const { data } = await api.patch<Ticket>(
      `/tickets/${ticketId}/complete`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return data;
  },
};
