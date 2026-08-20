"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Barbershop, QueueEntry } from "@/types/database";

interface UseQueueRealtimeResult {
  barbershop: Barbershop | null;
  entries: QueueEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQueueRealtime(
  barbershopId: string | null
): UseQueueRealtimeResult {
  const [barbershop, setBarbershop] =
    useState<Barbershop | null>(null);

  const [entries, setEntries] =
    useState<QueueEntry[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const supabaseRef = useRef(createClient());

  const fetchAll = useCallback(async () => {
    if (!barbershopId) {
      if (mountedRef.current) {
        setBarbershop(null);
        setEntries([]);
        setLoading(false);
      }

      return;
    }

    // Evita várias consultas simultâneas
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;

    try {
      const [
        { data: shop, error: shopError },
        { data: queue, error: queueError },
      ] = await Promise.all([
        supabaseRef.current
          .from("barbershops")
          .select("*")
          .eq("id", barbershopId)
          .single(),

        supabaseRef.current
          .from("queue_entries")
          .select("*")
          .eq("barbershop_id", barbershopId)
          .in("status", [
            "WAITING",
            "CALLED",
            "IN_SERVICE",
          ])
          .order("position", {
            ascending: true,
          }),
      ]);

      if (shopError) {
        throw shopError;
      }

      if (queueError) {
        throw queueError;
      }

      if (!mountedRef.current) {
        return;
      }

      setBarbershop(shop);
      setEntries(queue ?? []);
      setError(null);
    } catch (err) {
      console.error(
        "[Queue] Erro ao carregar dados:",
        err
      );

      if (mountedRef.current) {
        setError(
          "Não foi possível carregar a fila agora. Verifique sua conexão."
        );
      }
    } finally {
      fetchingRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [barbershopId]);

  useEffect(() => {
    mountedRef.current = true;

    if (!barbershopId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Carregamento inicial
    fetchAll();

    const channelName = `queue-realtime-${barbershopId}`;

    console.log(
      `[Queue] Criando canal Realtime: ${channelName}`
    );

    const channel = supabaseRef.current
      .channel(channelName)

      // ------------------------------------------
      // FILA
      // ------------------------------------------

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `barbershop_id=eq.${barbershopId}`,
        },
        (payload) => {
          console.log(
            "[Queue] Alteração recebida:",
            payload
          );

          if (mountedRef.current) {
            fetchAll();
          }
        }
      )

      // ------------------------------------------
      // BARBEARIA
      // ------------------------------------------

      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "barbershops",
          filter: `id=eq.${barbershopId}`,
        },
        (payload) => {
          console.log(
            "[Barbershop] Alteração recebida:",
            payload
          );

          if (mountedRef.current) {
            fetchAll();
          }
        }
      )

      // ------------------------------------------
      // STATUS DO CANAL
      // ------------------------------------------

      .subscribe((status) => {
        console.log(
          `[Queue] Realtime status: ${status}`
        );

        if (status === "SUBSCRIBED") {
          console.log(
            "[Queue] Realtime conectado com sucesso."
          );
        }

        if (status === "CHANNEL_ERROR") {
          console.error(
            "[Queue] Erro no canal Realtime."
          );
        }

        if (status === "TIMED_OUT") {
          console.error(
            "[Queue] Realtime demorou demais para conectar."
          );
        }

        if (status === "CLOSED") {
          console.warn(
            "[Queue] Canal Realtime fechado."
          );
        }
      });

    return () => {
      mountedRef.current = false;

      console.log(
        `[Queue] Removendo canal: ${channelName}`
      );

      supabaseRef.current.removeChannel(channel);
    };
  }, [barbershopId, fetchAll]);

  // Camada extra de resiliência: se a conexão Realtime cair sem avisar
  // (aba em segundo plano, rede instável), qualquer volta de foco ou de
  // internet força uma atualização imediata — sem precisar de F5.
  useEffect(() => {
    if (!barbershopId) return;

    function handleReconnect() {
      fetchAll();
    }
    window.addEventListener("focus", handleReconnect);
    window.addEventListener("online", handleReconnect);

    // Poll de segurança: garante que a tela nunca fica desatualizada por
    // mais de 15s, mesmo se o Realtime falhar silenciosamente.
    const pollId = window.setInterval(fetchAll, 15000);

    return () => {
      window.removeEventListener("focus", handleReconnect);
      window.removeEventListener("online", handleReconnect);
      window.clearInterval(pollId);
    };
  }, [barbershopId, fetchAll]);

  return {
    barbershop,
    entries,
    loading,
    error,
    refetch: fetchAll,
  };
}