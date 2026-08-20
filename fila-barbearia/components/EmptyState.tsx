interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="surface-card flex flex-col items-center gap-1.5 py-10 text-center animate-riseIn">
      <p className="text-base font-medium text-cream">{title}</p>
      {description && <p className="text-sm text-muted">{description}</p>}
    </div>
  );
}
