"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useAuth } from "@/contexts/auth.context";
import { receptionistService } from "@/services/receptionist.service";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ticket } from "@/types/ticket";
import type { Queue } from "@/types/queue";

export default function RecepcionistaPage() {
  const router = useRouter();
  const { user, accessToken, loading: authLoading } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingCall, setLoadingCall] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) return;
    if (!user || !accessToken) {
      router.push("/login");
      return;
    }
    if (user.role !== "RECEPTIONIST") {
      router.push("/login");
    }
  }, [mounted, authLoading, user, accessToken, router]);

  useEffect(() => {
    if (!user?.healthUnitId || !accessToken) return;

    api
      .get<Queue>(`/queue/${user.healthUnitId}`)
      .then((res) => setQueue(res.data))
      .catch(() => null);

    receptionistService
      .getTodayTickets(accessToken)
      .then((data) => setTickets(data))
      .catch(() => null);
  }, [user?.healthUnitId, accessToken]);

  useEffect(() => {
    if (!user?.healthUnitId || !accessToken) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      auth: { token: accessToken },
    });

    socket.on("connect", () => {
      socket.emit("join:unit", { healthUnitId: user.healthUnitId });
    });

    socket.on("queue:update", (data: Queue) => {
      setQueue(data);
    });

    return () => {
      socket.emit("leave:unit", { healthUnitId: user.healthUnitId });
      socket.disconnect();
    };
  }, [user?.healthUnitId, accessToken]);

  async function handleCallNext() {
    if (!accessToken) return;
    setLoadingCall(true);
    setError("");

    try {
      const ticket = await receptionistService.callNext(accessToken);

      setTickets((prev) => [...prev, ticket]);
    } catch {
      setError("Não há pacientes aguardando na fila");
    } finally {
      setLoadingCall(false);
    }
  }

  if (!mounted || authLoading) return null;
  if (!user || !accessToken) return null;

  const waitingCount =
    queue?.entries?.filter((e) => e.status === "WAITING").length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Painel da Recepcionista</h1>
          <p className="text-muted-foreground text-sm">
            {waitingCount} paciente(s) aguardando
          </p>
        </div>

        {/* botão chamar próximo */}
        <Button
          className="w-full h-14 text-lg"
          onClick={handleCallNext}
          disabled={loadingCall || waitingCount === 0}
        >
          {loadingCall ? "Chamando..." : "Chamar próximo"}
        </Button>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* fila atual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Fila atual — {waitingCount} aguardando
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!queue?.entries || queue.entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum paciente na fila
              </p>
            ) : (
              <div className="space-y-2">
                {queue.entries
                  .filter((e) => e.status === "WAITING")
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <span className="text-sm font-medium">
                        #{entry.position}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Paciente na posição {entry.position}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* fichas emitidas hoje */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Fichas emitidas hoje — {tickets.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma ficha emitida hoje
              </p>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        Ficha #{ticket.ticketNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.queueEntry?.user?.name ??
                          "Paciente não identificado"}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                      {ticket.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
