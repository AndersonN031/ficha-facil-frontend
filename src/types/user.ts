export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  healthUnitId: string | null;
}
