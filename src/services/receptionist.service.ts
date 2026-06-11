import { api } from "@/lib/api";
import { Ticket } from "@/types/ticket";

export const receptionistService = {
  async callNext(accessToken: string): Promise<Ticket> {
    const { data } = await api.post<Ticket>(
      "/tickets/call-next",
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return data;
  },

  async getTodayTickets(accessToken: string): Promise<Ticket[]> {
    const { data } = await api.get<Ticket[]>("/tickets/today", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data;
  },
};
