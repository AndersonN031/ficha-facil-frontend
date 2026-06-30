export interface HealthUnit {
  id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  cnes?: string | null;
  maxTicketsDay: number;
  openTime: string;
  closeTime: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
