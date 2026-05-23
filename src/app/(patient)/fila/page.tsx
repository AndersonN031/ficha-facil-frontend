"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { useHealthUnits } from "@/hooks/useHealthUnits";
import { useQueue } from "@/hooks/useQueue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function FilaPage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const { units, loading: loadingUnits } = useHealthUnits(city, state);

  const { entry, position, isCalled, loading, error, enterQueue, leaveQueue } =
    useQueue({
      healthUnitId: selectedUnitId ?? "",
      userId: user?.id ?? "",
      accessToken: accessToken ?? "",
    });

  if (!user || !accessToken) return null;

  if (entry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isCalled ? "🔔 Você foi chamado!" : "Você está na fila"}
            </CardTitle>
            <CardDescription>
              {isCalled
                ? "Dirija-se à recepção imediatamente"
                : "Aguarde, avisaremos quando for sua vez"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!isCalled && (
              <div className="text-6xl font-bold text-primary py-6">
                {position}
              </div>
            )}
            {!isCalled && (
              <p className="text-sm text-muted-foreground">
                sua posição na fila
              </p>
            )}
          </CardContent>

          <CardFooter className="justify-center">
            {!isCalled && (
              <Button
                variant="destructive"
                onClick={() => void leaveQueue()}
                disabled={loading}
              >
                {loading ? "Cancelando..." : "Cancelar minha vez"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Postos disponíveis</h1>
          <p className="text-muted-foreground text-sm">
            Filtre por cidade e entre na fila virtual
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              placeholder="Ex: Caruaru"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="w-24 space-y-1">
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              placeholder="PE"
              maxLength={2}
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {loadingUnits ? (
          <p className="text-sm text-muted-foreground">Carregando postos...</p>
        ) : units.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum posto encontrado. Tente outro filtro.
          </p>
        ) : (
          <div className="space-y-3">
            {units.map((unit) => (
              <Card key={unit.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{unit.name}</CardTitle>
                  <CardDescription>
                    {unit.address} — {unit.city}/{unit.state}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground">
                    Atendimento: {unit.openTime} às {unit.closeTime} •{" "}
                    {unit.maxTicketsDay} fichas/dia
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    disabled={loading && selectedUnitId === unit.id}
                    onClick={() => {
                      setSelectedUnitId(unit.id);
                      void enterQueue(unit.id);
                    }}
                  >
                    {loading && selectedUnitId === unit.id
                      ? "Entrando..."
                      : "Entrar na fila"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
