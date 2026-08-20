import type { QueueEntry } from "@/types/database";

interface QueueListItemProps {
  entry: QueueEntry;
  index: number;
  onRemove: (entry: QueueEntry) => void;
}

const STATUS_LABEL: Record<string, string> = {
  WAITING: "Aguardando",
  CALLED: "Chamado",
  IN_SERVICE: "Em atendimento",
};

export function QueueListItem({ entry, index, onRemove }: QueueListItemProps) {
  const isActive = entry.status === "CALLED" || entry.status === "IN_SERVICE";

  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition ${
        isActive
          ? "border-gold-500/40 bg-gold-500/10"
          : "border-ink-700 bg-ink-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${
            isActive ? "bg-gold-500 text-ink-950" : "bg-ink-800 text-cream"
          }`}
        >
          {entry.status === "WAITING" ? entry.position : index + 1}
        </span>
        <div>
          <p className="font-medium text-cream">{entry.customer_name}</p>
          {isActive && (
            <p className="text-xs font-medium uppercase tracking-wide text-gold-400">
              {STATUS_LABEL[entry.status]}
            </p>
          )}
        </div>
      </div>

      {entry.status === "WAITING" && (
        <button
          onClick={() => onRemove(entry)}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-bad/10 hover:text-bad"
          aria-label={`Remover ${entry.customer_name} da fila`}
        >
          Remover
        </button>
      )}
    </li>
  );
}
