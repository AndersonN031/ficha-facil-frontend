"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth.context";
import { doctorService } from "@/services/doctor.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ticket } from "@/types/ticket";

export default function PainelMedicoPage() {
  const { user, accessToken, loading: authLoading } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    doctorService
      .getTodayTickets(accessToken)
      .then((data) => setTickets(data))
      .catch(() => null);
  }, [accessToken]);

  async function handleStart(ticketId: string) {
    if (!accessToken) return;
    setLoadingAction(ticketId);
    setError("");

    try {
      const updated = await doctorService.startTreatment(ticketId, accessToken);
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t)),
      );
    } catch {
      setError("Não foi possível iniciar o atendimento");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleComplete(ticketId: string) {
    if (!accessToken) return;
    setLoadingAction(ticketId);
    setError("");

    try {
      const updated = await doctorService.completeTreatment(
        ticketId,
        accessToken,
      );
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t)),
      );
    } catch {
      setError("Não foi possível concluir o atendimento");
    } finally {
      setLoadingAction(null);
    }
  }

  if (!mounted || authLoading) return null;
  if (!user || !accessToken) return null;

  const waiting = tickets.filter((t) => t.status === "WAITING");
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS");
  const done = tickets.filter((t) => t.status === "DONE");

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Painel do Médico</h1>
          <p className="text-muted-foreground text-sm">
            {waiting.length} aguardando · {inProgress.length} em atendimento ·{" "}
            {done.length} concluídos
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fichas do dia</CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma ficha para hoje
              </p>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        Ficha #{ticket.ticketNumber} —{" "}
                        {ticket.queueEntry?.user?.name ??
                          "Paciente não identificado"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Chegada:{" "}
                        {new Date(ticket.createdAt).toLocaleTimeString(
                          "pt-BR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                        {ticket.status}
                      </span>

                      {ticket.status === "WAITING" && (
                        <Button
                          size="sm"
                          disabled={loadingAction === ticket.id}
                          onClick={() => handleStart(ticket.id)}
                        >
                          {loadingAction === ticket.id ? "..." : "Iniciar"}
                        </Button>
                      )}

                      {ticket.status === "IN_PROGRESS" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingAction === ticket.id}
                          onClick={() => handleComplete(ticket.id)}
                        >
                          {loadingAction === ticket.id ? "..." : "Concluir"}
                        </Button>
                      )}
                    </div>
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
