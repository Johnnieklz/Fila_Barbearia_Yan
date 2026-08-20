"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ErrorBanner } from "@/components/ErrorBanner";
import { QRCodePanel } from "@/components/QRCodePanel";
import type { Barbershop } from "@/types/database";

interface BarbershopSettingsFormProps {
  barbershop: Barbershop;
  publicUrl: string;
}

export function BarbershopSettingsForm({
  barbershop,
  publicUrl,
}: BarbershopSettingsFormProps) {
  const [name, setName] = useState(barbershop.name);
  const [averageMinutes, setAverageMinutes] = useState(
    barbershop.average_service_minutes
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("O nome da barbearia não pode ficar vazio.");
      return;
    }
    if (averageMinutes < 1 || averageMinutes > 240) {
      setError("O tempo médio de atendimento deve ser entre 1 e 240 minutos.");
      return;
    }

    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("barbershops")
      .update({ name: name.trim(), average_service_minutes: averageMinutes })
      .eq("id", barbershop.id);

    setSaving(false);
    if (updateError) {
      setError("Não foi possível salvar. Tente novamente.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSave} className="surface-card flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-cream">
          Dados da barbearia
        </h2>

        <div>
          <label htmlFor="settings-name" className="mb-1.5 block text-sm text-muted">
            Nome
          </label>
          <input
            id="settings-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input"
            maxLength={80}
          />
        </div>

        <div>
          <label htmlFor="settings-avg" className="mb-1.5 block text-sm text-muted">
            Tempo médio por atendimento (minutos)
          </label>
          <input
            id="settings-avg"
            type="number"
            min={1}
            max={240}
            value={averageMinutes}
            onChange={(e) => setAverageMinutes(Number(e.target.value))}
            className="field-input"
          />
          <p className="mt-1.5 text-xs text-muted">
            Usado para calcular a estimativa de espera mostrada aos clientes.
          </p>
        </div>

        {error && <ErrorBanner message={error} />}
        {saved && <p className="text-sm text-good">Salvo!</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      <QRCodePanel publicUrl={publicUrl} barbershopName={barbershop.name} />
    </div>
  );
}
