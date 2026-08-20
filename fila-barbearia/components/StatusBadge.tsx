interface StatusBadgeProps {
  open: boolean;
}

export function StatusBadge({ open }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${
        open
          ? "border-good/30 bg-good/10 text-good"
          : "border-bad/30 bg-bad/10 text-bad"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${open ? "bg-good" : "bg-bad"}`}
        aria-hidden
      />
      {open ? "Fila aberta" : "Fila fechada"}
    </span>
  );
}
