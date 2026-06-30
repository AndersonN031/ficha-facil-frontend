"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth.context";
import { adminService } from "@/services/admin.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/types/user";
import type { HealthUnit } from "@/types/healthUnit";

const ROLES = ["PATIENT", "RECEPTIONIST", "DOCTOR", "ADMIN"];

export default function AdminPage() {
  const { user, accessToken, loading: authLoading } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [unit, setUnit] = useState<HealthUnit | null>(null);
  const [loadingUnit, setLoadingUnit] = useState(false);
  const [unitError, setUnitError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!accessToken || !user?.healthUnitId) return;

    adminService
      .listUsers(user.healthUnitId, accessToken)
      .then((data) => setUsers(data))
      .catch(() => setError("Erro ao carregar usuários"));

    adminService
      .getHealthUnit(user.healthUnitId, accessToken)
      .then((data) => setUnit(data))
      .catch(() => setUnitError("Erro ao carregar dados do posto"));
  }, [accessToken, user?.healthUnitId]);

  async function handleRoleChange(userId: string, role: string) {
    if (!accessToken) return;
    setLoadingAction(userId);
    setError("");

    try {
      const updated = await adminService.manageUser(
        userId,
        { role },
        accessToken,
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch {
      setError("Erro ao atualizar role");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleToggleActive(userId: string, active: boolean) {
    if (!accessToken) return;
    setLoadingAction(userId);
    setError("");

    try {
      const updated = await adminService.manageUser(
        userId,
        { active: !active },
        accessToken,
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch {
      setError("Erro ao atualizar status");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleSaveUnit() {
    if (!accessToken || !unit || !user?.healthUnitId) return;
    setLoadingUnit(true);
    setUnitError("");

    try {
      const payload = {
        name: unit.name,
        address: unit.address,
        city: unit.city,
        state: unit.state,
        cnes: unit.cnes,
        maxTicketsDay: unit.maxTicketsDay,
        openTime: unit.openTime,
        closeTime: unit.closeTime,
      };

      const updated = await adminService.updateHealthUnit(
        user.healthUnitId,
        payload,
        accessToken,
      );

      setUnit(updated);
      console.log(updated);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setUnitError(error.response?.data?.message ?? "Erro ao atualizar posto");
    } finally {
      setLoadingUnit(false);
    }
  }

  if (!mounted || authLoading) return null;
  if (!user || !accessToken) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground text-sm">
            {users.length} usuário(s) no posto
          </p>
        </div>

        {/* Configurações do posto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configurações do posto</CardTitle>
          </CardHeader>
          <CardContent>
            {!unit ? (
              <p className="text-sm text-muted-foreground">
                Carregando dados do posto...
              </p>
            ) : (
              <div className="space-y-4">
                {unitError && (
                  <p className="text-sm text-red-500">{unitError}</p>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="maxTicketsDay">Limite de fichas/dia</Label>
                    <Input
                      id="maxTicketsDay"
                      type="number"
                      min={1}
                      value={unit.maxTicketsDay}
                      onChange={(e) =>
                        setUnit({
                          ...unit,
                          maxTicketsDay: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="openTime">Abertura</Label>
                    <Input
                      id="openTime"
                      type="time"
                      value={unit.openTime}
                      onChange={(e) =>
                        setUnit({ ...unit, openTime: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="closeTime">Fechamento</Label>
                    <Input
                      id="closeTime"
                      type="time"
                      value={unit.closeTime}
                      onChange={(e) =>
                        setUnit({ ...unit, closeTime: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={() => void handleSaveUnit()}
                  disabled={loadingUnit}
                >
                  {loadingUnit ? "Salvando..." : "Salvar configurações"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Lista de usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usuários do posto</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum usuário encontrado
              </p>
            ) : (
              <div className="space-y-4">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        className="text-xs border rounded px-2 py-1"
                        value={u.role}
                        disabled={loadingAction === u.id}
                        onChange={(e) =>
                          void handleRoleChange(u.id, e.target.value)
                        }
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>

                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          u.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {u.active ? "Ativo" : "Inativo"}
                      </span>

                      <Button
                        size="sm"
                        variant={u.active ? "destructive" : "outline"}
                        disabled={loadingAction === u.id}
                        onClick={() => void handleToggleActive(u.id, u.active)}
                      >
                        {loadingAction === u.id
                          ? "..."
                          : u.active
                            ? "Desativar"
                            : "Ativar"}
                      </Button>
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
