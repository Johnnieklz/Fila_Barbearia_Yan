export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-muted">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-ink-700 border-t-gold-500"
        role="status"
        aria-label={label}
      />
      <p className="text-sm">{label}</p>
    </div>
  );
}
