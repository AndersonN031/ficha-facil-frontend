"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api";

interface QueueEntry {
  id: string;
  position: number;
  status: string;
}

interface UseQueueProps {
  healthUnitId: string;
  userId: string;
  accessToken: string;
}

export function useQueue({ healthUnitId, userId, accessToken }: UseQueueProps) {
  const router = useRouter();

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

  const [isCalled, setIsCalled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("isCalled") === "true";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef<Socket | null>(null);

  // restaura entry do backend se não estiver no sessionStorage
  useEffect(() => {
    if (!accessToken) return;

    void api
      .get<QueueEntry & { position: number; status: string }>(
        "/queue/my-entry",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )
      .then((res) => {
        if (res.data) {
          if (res.data.status === "DONE") {
            setEntry(null);
            setPosition(null);
            setIsCalled(false);
            sessionStorage.removeItem("queueEntry");
            sessionStorage.removeItem("queuePosition");
            sessionStorage.removeItem("isCalled");
            router.push("/fila");
            return;
          }

          setEntry(res.data);
          setPosition(res.data.position);
          sessionStorage.setItem("queueEntry", JSON.stringify(res.data));
          sessionStorage.setItem("queuePosition", String(res.data.position));

          if (res.data.status === "CALLED") {
            setIsCalled(true);
            sessionStorage.setItem("isCalled", "true");
          }
        }
      })
      .catch(() => null);
  }, [accessToken]);

  // Socket.io
  useEffect(() => {
    if (!accessToken || !healthUnitId) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      auth: { token: accessToken },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join:unit", { healthUnitId });
    });

    socket.on(
      "queue:update",
      (data: { entries: { userId: string; position: number }[] }) => {
        const myEntry = data.entries.find((e) => e.userId === userId);
        if (myEntry) {
          setPosition(myEntry.position);
          sessionStorage.setItem("queuePosition", String(myEntry.position));
        }
      },
    );

    socket.on("ticket:called", (data: { userId: string }) => {
      if (data.userId === userId) {
        setIsCalled(true);
        sessionStorage.setItem("isCalled", "true");
      }
    });

    socket.on("ticket:done", (data: { userId: string }) => {
      if (data.userId === userId) {
        setEntry(null);
        setPosition(null);
        setIsCalled(false);
        sessionStorage.removeItem("queueEntry");
        sessionStorage.removeItem("queuePosition");
        sessionStorage.removeItem("isCalled");
        router.push("/fila");
      }
    });

    return () => {
      socket.emit("leave:unit", { healthUnitId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, healthUnitId, userId]);

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
        sessionStorage.setItem("healthUnitId", unitId);
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
      sessionStorage.removeItem("isCalled");
      sessionStorage.removeItem("healthUnitId");
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
