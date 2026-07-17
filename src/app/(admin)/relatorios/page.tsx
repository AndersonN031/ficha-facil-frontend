"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth.context";
import { adminService } from "@/services/admin.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailyReport } from "@/types/reports";

export default function RelatoriosPage() {
  const { user, accessToken, loading: authLoading } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!accessToken || !mounted) return;

    void fetchReport(date);
  }, [accessToken, mounted]);

  async function fetchReport(selectedDate: string) {
    if (!accessToken) return;
    setLoading(true);
    setError("");

    try {
      const data = await adminService.getDailyReport(selectedDate, accessToken);
      setReport(data);
    } catch {
      setError("Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || authLoading) return null;
  if (!user || !accessToken) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground text-sm">
            Métricas do dia por posto
          </p>
        </div>

        {/* filtro por data */}
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <button
            className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-50"
            disabled={loading}
            onClick={() => void fetchReport(date)}
          >
            {loading ? "Carregando..." : "Buscar"}
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {report && (
          <>
            {/* cards de métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground font-normal">
                    Fichas emitidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{report.totalTickets}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground font-normal">
                    Atendimentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {report.completedTickets}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground font-normal">
                    Cancelamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{report.cancellations}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground font-normal">
                    Espera média
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {report.avgWaitMinutes}min
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* gráfico fichas por hora */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fichas por hora</CardTitle>
              </CardHeader>
              <CardContent>
                {report.ticketsByHour.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma ficha emitida neste dia
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={report.ticketsByHour}>
                      <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name="Fichas"
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* atendimentos por médico */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Atendimentos por médico
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.byDoctor.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum atendimento concluído
                  </p>
                ) : (
                  <div className="space-y-2">
                    {report.byDoctor.map((d) => (
                      <div
                        key={d.name}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <p className="text-sm font-medium">{d.name}</p>
                        <span className="text-sm text-muted-foreground">
                          {d.count} atendimento(s)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
