"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueueRealtime } from "@/hooks/useQueueRealtime";
import { estimateWaitMinutes, formatWaitEstimate } from "@/lib/queue/estimate";
import { StatusBadge } from "@/components/StatusBadge";
import { QueueListItem } from "@/components/QueueListItem";
import { AddCustomerModal } from "@/components/AddCustomerModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/LoadingState";
import type { QueueEntry } from "@/types/database";

interface BarberQueueDashboardProps {
  barbershopId: string;
  barbershopName: string;
}

export function BarberQueueDashboard({
  barbershopId,
  barbershopName,
}: BarberQueueDashboardProps) {
  const {
    barbershop,
    entries,
    loading,
    error,
    refetch,
  } = useQueueRealtime(barbershopId);

  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<QueueEntry | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [callingNext, setCallingNext] = useState(false);
  const [togglingQueue, setTogglingQueue] = useState(false);

  const waiting = useMemo(
    () =>
      entries
        .filter((entry) => entry.status === "WAITING")
        .sort((a, b) => a.position - b.position),
    [entries]
  );

  const active = useMemo(
    () =>
      entries.find(
        (entry) =>
          entry.status === "CALLED" ||
          entry.status === "IN_SERVICE"
      ),
    [entries]
  );

  const averageMinutes =
    barbershop?.average_service_minutes ?? 30;

  const estimateMinutes = estimateWaitMinutes(
    waiting.length,
    averageMinutes
  );

  async function handleCallNext() {
    setActionError(null);
    setCallingNext(true);
    const supabase = createClient();

    const { data, error: rpcError } = await supabase.rpc(
      "call_next",
      {
        target_barbershop_id: barbershopId,
      }
    );

    setCallingNext(false);

    if (rpcError) {
      console.error("Erro ao chamar próximo:", rpcError);
      setActionError(
        "Não foi possível chamar o próximo cliente. Tente novamente."
      );
      return;
    }

    if (!data) {
      setActionError(
        "Não há ninguém aguardando na fila."
      );
    }
  }

  async function handleAddCustomer(name: string) {
    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("queue_entries")
      .insert({
        barbershop_id: barbershopId,
        customer_name: name,
        status: "WAITING",
      });

    if (insertError) {
      console.error("Erro ao adicionar cliente:", insertError);
      throw insertError;
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("queue_entries")
      .update({
        status: "REMOVED",
      })
      .eq("id", removeTarget.id);

    setRemoveTarget(null);

    if (updateError) {
      console.error("Erro ao remover cliente:", updateError);
      setActionError(
        "Não foi possível remover o cliente. Tente novamente."
      );
    }
  }

  async function handleCompleteService() {
    if (!active) return;

    setActionError(null);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("queue_entries")
      .update({
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
      })
      .eq("id", active.id);

    if (updateError) {
      console.error(
        "Erro ao concluir atendimento:",
        updateError
      );

      setActionError(
        "Não foi possível concluir o atendimento. Tente novamente."
      );
    }
  }

  async function handleToggleQueue() {
    if (!barbershop) return;

    setTogglingQueue(true);
    setActionError(null);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("barbershops")
      .update({
        queue_open: !barbershop.queue_open,
      })
      .eq("id", barbershopId);

    setTogglingQueue(false);

    if (updateError) {
      console.error(
        "Erro ao alterar status da fila:",
        updateError
      );

      setActionError(
        "Não foi possível atualizar o status da fila."
      );
    }
  }

  if (loading) {
    return <LoadingState label="Carregando fila..." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-cream">
            {barbershopName}
          </h1>

          {barbershop && (
            <StatusBadge open={barbershop.queue_open} />
          )}
        </div>

        <button
          onClick={handleToggleQueue}
          disabled={togglingQueue || !barbershop}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            barbershop?.queue_open
              ? "bg-bad/10 text-bad hover:bg-bad/20"
              : "bg-good/10 text-good hover:bg-good/20"
          }`}
        >
          {barbershop?.queue_open
            ? "Fechar fila"
            : "Abrir fila"}
        </button>
      </header>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={refetch}
        />
      )}

      {actionError && (
        <ErrorBanner message={actionError} />
      )}

      <div className="surface-card flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">
            Aguardando
          </p>

          <p className="font-display text-2xl font-semibold text-cream">
            {waiting.length}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-muted">
            Tempo estimado
          </p>

          <p className="font-display text-2xl font-semibold text-cream">
            {waiting.length === 0
              ? "—"
              : formatWaitEstimate(estimateMinutes)}
          </p>
        </div>
      </div>

      {active && (
        <div className="surface-card border-gold-500/40 bg-gold-500/5">
          <p className="text-sm text-muted">
            Com o barbeiro agora
          </p>

          <p className="font-display text-lg font-semibold text-gold-400">
            {active.customer_name}
          </p>

          <button
            onClick={handleCompleteService}
            className="btn-secondary mt-3 !py-3 text-sm"
          >
            Concluir atendimento
          </button>
        </div>
      )}

      <button
        onClick={handleCallNext}
        disabled={
          callingNext ||
          waiting.length === 0 ||
          !!active
        }
        className="btn-primary py-5 text-lg"
      >
        {callingNext
          ? "Chamando..."
          : active
            ? "Conclua o atendimento atual primeiro"
            : "Chamar próximo"}
      </button>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted">
          Fila de espera
        </h2>

        {waiting.length === 0 ? (
          <EmptyState
            title="Nenhum cliente aguardando"
            description="Assim que alguém entrar na fila, aparecerá aqui."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {waiting.map((entry, index) => (
              <QueueListItem
                key={entry.id}
                entry={entry}
                index={index}
                onRemove={setRemoveTarget}
              />
            ))}
          </ul>
        )}
      </section>

      <button
        className="btn-secondary"
        onClick={() => setAddOpen(true)}
      >
        + Adicionar cliente
      </button>

      <AddCustomerModal
        open={addOpen}
        onAdd={handleAddCustomer}
        onClose={() => setAddOpen(false)}
      />

      <ConfirmDialog
        open={!!removeTarget}
        title={`Remover ${
          removeTarget?.customer_name ?? ""
        }?`}
        description="Essa ação não pode ser desfeita."
        confirmLabel="Remover"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}