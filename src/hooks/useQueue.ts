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
  //   const [socket, setSocket] = useState<Socket | null>(null);
  const [entry, setEntry] = useState<QueueEntry | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [isCalled, setIsCalled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL!, {
      auth: { token: accessToken },
    });

    newSocket.on("connect", () => {
      newSocket.emit("join:unit", { healthUnitId });
    });

    newSocket.on("queue:update", (data: QueueUpdate) => {
      const myEntry = data.entries.find((e) => e.userId === userId);
      if (myEntry) {
        setPosition(myEntry.position);
      }
    });
    newSocket.on(
      "ticket:called",
      (data: { userId: string; message: string }) => {
        if (data.userId === userId) {
          setIsCalled(true);
        }
      },
    );

    socketRef.current = newSocket;

    return () => {
      newSocket.emit("leave:unit", { healthUnitId });
      newSocket.disconnect();
    };
  }, [healthUnitId, userId, accessToken]);

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
