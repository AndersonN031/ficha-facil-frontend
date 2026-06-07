"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api";

interface QueueEntry {
  id: string;
  position: number;
  status: string;
}

interface QueueUpdate {
  healthUnitId: string;
  ticketCount: number;
  entries: {
    userId: string;
    position: number;
    status: string;
  }[];
}

interface UseQueueProps {
  healthUnitId: string;
  userId: string;
  accessToken: string;
}

export function useQueue({ healthUnitId, userId, accessToken }: UseQueueProps) {
  const [entry, setEntry] = useState<QueueEntry | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem("queueEntry");
    return stored ? (JSON.parse(stored) as QueueEntry) : null;
  });

  const [position, setPosition] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem("queuePosition");
    return stored ? Number(stored) : null;
  });

  const [isCalled, setIsCalled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    if (entry) return; 

    void api
      .get<QueueEntry & { position: number }>("/queue/my-entry", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        if (res.data) {
          setEntry(res.data);
          setPosition(res.data.position);
          sessionStorage.setItem("queueEntry", JSON.stringify(res.data));
          sessionStorage.setItem("queuePosition", String(res.data.position));
        }
      })
      .catch(() => null);
  }, [accessToken]);

  const enterQueue = useCallback(
    async (unitId: string) => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.post<{
          entry: QueueEntry;
          position: number;
        }>(
          `/queue/${unitId}/enter`,
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        setEntry(data.entry);
        setPosition(data.position);
        sessionStorage.setItem("queueEntry", JSON.stringify(data.entry));
        sessionStorage.setItem("queuePosition", String(data.position));
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message ?? "Erro ao entrar na fila");
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const leaveQueue = useCallback(async () => {
    if (!entry) return;
    setLoading(true);
    setError("");
    try {
      await api.delete(`/queue/${entry.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setEntry(null);
      setPosition(null);
      setIsCalled(false);
      sessionStorage.removeItem("queueEntry");
      sessionStorage.removeItem("queuePosition");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message ?? "Erro ao cancelar");
    } finally {
      setLoading(false);
    }
  }, [entry, accessToken]);

  return {
    entry,
    position,
    isCalled,
    loading,
    error,
    enterQueue,
    leaveQueue,
  };
}
