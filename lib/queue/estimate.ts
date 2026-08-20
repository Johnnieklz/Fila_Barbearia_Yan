/**
 * Cálculo de tempo estimado de espera.
 *
 * Estratégia do MVP: tempo médio de atendimento × pessoas na frente.
 * O tempo médio hoje vem de barbershops.average_service_minutes
 * (configurável pelo barbeiro). No futuro, `averageMinutes` pode ser
 * substituído pela média real calculada a partir do histórico de
 * atendimentos concluídos (completed_at - called_at), sem precisar
 * mudar a assinatura desta função — apenas o valor passado a ela.
 */
export function estimateWaitMinutes(
  peopleAhead: number,
  averageMinutesPerService: number
): number {
  if (peopleAhead <= 0) return 0;
  return Math.max(0, Math.round(peopleAhead * averageMinutesPerService));
}

/**
 * Formata minutos em um texto amigável e sempre deixa claro que é uma
 * aproximação, conforme pedido no briefing ("aproximadamente 1h15").
 */
export function formatWaitEstimate(minutes: number): string {
  if (minutes <= 0) return "Você é o próximo!";

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) {
    return `aproximadamente ${remainder} min`;
  }

  if (remainder === 0) {
    return `aproximadamente ${hours}h`;
  }

  return `aproximadamente ${hours}h${String(remainder).padStart(2, "0")}`;
}

/**
 * Calcula a média real de atendimento a partir de entradas concluídas
 * (called_at -> completed_at). Preparado para o "próximo passo" descrito
 * no briefing (seção 22, item 16), ainda não usado no MVP.
 */
export function computeHistoricalAverageMinutes(
  completedEntries: { called_at: string | null; completed_at: string | null }[],
  fallbackMinutes: number
): number {
  const durations = completedEntries
    .filter((e) => e.called_at && e.completed_at)
    .map((e) => {
      const start = new Date(e.called_at as string).getTime();
      const end = new Date(e.completed_at as string).getTime();
      return (end - start) / 60000;
    })
    .filter((minutes) => minutes > 0 && minutes < 6 * 60); // descarta outliers

  if (durations.length === 0) return fallbackMinutes;

  const avg = durations.reduce((sum, m) => sum + m, 0) / durations.length;
  return Math.round(avg);
}
