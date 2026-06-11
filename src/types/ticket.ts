export interface Ticket {
  id: string;
  ticketNumber: number;
  status: string;
  createdAt: string;
  queueEntry: {
    position: number;
    user: {
      id: string;
      name: string;
      cpf: string;
    };
  };
}