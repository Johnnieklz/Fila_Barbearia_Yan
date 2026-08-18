"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useQueueRealtime } from "@/hooks/useQueueRealtime";
import {
  estimateWaitMinutes,
  formatWaitEstimate,
} from "@/lib/queue/estimate";
import {
  clearSession,
  generateClientToken,
  getStoredSession,
  saveSession,
} from "@/lib/queue/clientSession";
import { StatusBadge } from "@/components/StatusBadge";
import { JoinQueueForm } from "@/components/JoinQueueForm";
import { PositionBadge } from "@/components/PositionBadge";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/LoadingState";
import type { Barbershop } from "@/types/database";
import { aw } from "vitest/dist/chunks/reporters.nr4dxCkA.js";

interface PublicQueueViewProps {
  barbershop: Barbershop;
  }

export function PublicQueueView({
  barbershop: initialShop,
}: PublicQueueViewProps) {
  const {
    barbershop,
    entries,
    loading,
    error,
    refetch,
  } = useQueueRealtime(initialShop.id);

  const shop = barbershop ?? initialShop;

  const [myEntryId, setMyEntryId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const stored = getStoredSession(initialShop.id);

    if (stored) {
      setMyEntryId(stored.entryId);
    }
  }, [initialShop.id]);

  useEffect(() => {
    function goOffline() {
      setIsOffline(true);
    }

    function goOnline() {
      setIsOffline(false);
      refetch();
    }

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [refetch]);

  const waiting = useMemo(
    () =>
      entries
        .filter((entry) => entry.status === "WAITING")
        .sort((a, b) => a.position - b.position),
    [entries]
  );

  const myEntry = useMemo(
    () =>
      entries.find((entry) => entry.id === myEntryId) ?? null,
    [entries, myEntryId]
  );

  const averageMinutes = shop.average_service_minutes;

  async function handleJoin(name: string) {
    setJoinError(null);

    const clientToken = generateClientToken();

    const { data, error: insertError } = await supabase
      .from("queue_entries")
      .insert({
        barbershop_id: shop.id,
        customer_name: name,
        status: "WAITING",
        client_token: clientToken,
      })
      .select()
      .single();

    if (insertError || !data) {
      console.error(
        "Erro ao entrar na fila:",
        insertError
      );

      setJoinError(
        shop.queue_open
          ? "Não foi possível entrar na fila agora. Tente novamente."
          : "A fila está fechada no momento."
      );

      return;
    }

    saveSession({
      entryId: data.id,
      clientToken,
      barbershopId: shop.id,
      createdAt: new Date().toISOString(),
    });

    setMyEntryId(data.id);
    await refetch();
  }

  if (loading) {
    return <LoadingState label="Carregando fila..." />;
  }

  const myStatus = myEntry?.status;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-6 py-10">
      <header className="text-center">
        <h1 className="font-display text-2xl font-semibold text-cream">
          {shop.name}
        </h1>

        <div className="mt-2 flex justify-center">
          <StatusBadge open={shop.queue_open} />
        </div>
      </header>

      {isOffline && (
        <ErrorBanner
          message="Você está sem conexão. A fila será atualizada assim que a internet voltar."
        />
      )}

      {error && (
        <ErrorBanner
          message={error}
          onRetry={refetch}
        />
      )}

      {joinError && (
        <ErrorBanner message={joinError} />
      )}

      {myEntry ? (
        <section className="surface-card flex flex-col items-center gap-4 py-8 text-center animate-riseIn">
          <p className="text-muted">
            Olá, {myEntry.customer_name}!
          </p>

          {myStatus === "WAITING" && (
            <>
              <PositionBadge
                position={myEntry.position}
              />

              <p className="text-sm text-muted">
                {formatWaitEstimate(
                  estimateWaitMinutes(
                    myEntry.position - 1,
                    averageMinutes
                  )
                )}
              </p>

              {myEntry.position === 1 && (
                <p className="text-sm font-medium text-gold-400">
                  Você é o próximo!
                </p>
              )}
            </>
          )}

          {(myStatus === "CALLED" ||
            myStatus === "IN_SERVICE") && (
            <>
              <PositionBadge
                position={0}
                calledNow
              />

              <p className="font-medium text-gold-400">
                É a sua vez! Dirija-se ao barbeiro.
              </p>
            </>
          )}

          {myStatus === "COMPLETED" && (
            <p className="text-good">
              Atendimento concluído. Obrigado! ✂️
            </p>
          )}

          {myStatus === "REMOVED" && (
            <p className="text-muted">
              Você saiu da fila. Se ainda quiser ser
              atendido, entre novamente.
            </p>
          )}

          {(myStatus === "COMPLETED" ||
            myStatus === "REMOVED") && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                clearSession(shop.id);
                setMyEntryId(null);
              }}
            >
              Entrar na fila novamente
            </button>
          )}
        </section>
      ) : (
        <section className="surface-card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              Pessoas aguardando
            </p>

            <p className="font-display text-xl font-semibold text-cream">
              {waiting.length}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-ink-700 pt-3">
            <p className="text-sm text-muted">
              Tempo estimado
            </p>

            <p className="text-sm font-medium text-cream">
              {waiting.length === 0
                ? "Sem espera"
                : formatWaitEstimate(
                    estimateWaitMinutes(
                      waiting.length,
                      averageMinutes
                    )
                  )}
            </p>
          </div>
        </section>
      )}

      {!myEntry && (
        <section className="surface-card">
          {shop.queue_open ? (
            <JoinQueueForm onSubmit={handleJoin} />
          ) : (
            <p className="text-center text-sm text-muted">
              A fila está fechada no momento. Volte mais
              tarde ou fale com o barbeiro.
            </p>
          )}
        </section>
      )}
    </main>
  );
}