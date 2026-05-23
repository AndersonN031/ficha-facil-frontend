"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface HealthUnit {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  openTime: string;
  closeTime: string;
  maxTicketsDay: number;
  active: boolean;
}

export function useHealthUnits(city?: string, state?: string) {
  const [units, setUnits] = useState<HealthUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (city) params.append("city", city);
    if (state) params.append("state", state);

    api
      .get<HealthUnit[]>(`/health-units?${params.toString()}`)
      .then((res) => setUnits(res.data))
      .catch(() => setError("Erro ao carregar postos"))
      .finally(() => setLoading(false));
  }, [city, state]);

  return { units, loading, error };
}
