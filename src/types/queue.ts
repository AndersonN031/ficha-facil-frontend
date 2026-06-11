export interface QueueEntry {
  id: string;
  position: number;
  status: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    cpf: string;
  };
}

export interface Queue {
  id: string;
  status: string;
  ticketCount: number;
  healthUnitId: string;
  entries?: QueueEntry[];
}