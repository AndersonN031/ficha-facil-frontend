export interface DailyReport {
  date: string;
  totalTickets: number;
  completedTickets: number;
  cancellations: number;
  avgWaitMinutes: number;
  byDoctor: { name: string; count: number }[];
  ticketsByHour: { hour: string; count: number }[];
}