interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Mensagens de erro amigáveis (briefing seção 20) — nunca mostramos
 * stack traces ou erros técnicos do Postgres/Supabase ao usuário final.
 */
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="surface-card border-bad/30 bg-bad/5 text-center animate-riseIn">
      <p className="text-sm text-cream/90">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm font-semibold text-gold-400 underline underline-offset-4"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
