"use client";

import { useState } from "react";

interface JoinQueueFormProps {
  onSubmit: (name: string) => Promise<void>;
  disabled?: boolean;
}

export function JoinQueueForm({ onSubmit, disabled }: JoinQueueFormProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      setValidationError("Digite seu nome (mínimo 2 letras).");
      return;
    }
    if (trimmed.length > 60) {
      setValidationError("Nome muito longo.");
      return;
    }

    setValidationError(null);
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label htmlFor="customer-name" className="mb-1.5 block text-sm text-muted">
          Seu nome
        </label>
        <input
          id="customer-name"
          type="text"
          inputMode="text"
          autoComplete="name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: João Silva"
          className="field-input"
          maxLength={60}
          disabled={disabled || submitting}
        />
        {validationError && (
          <p className="mt-1.5 text-sm text-bad">{validationError}</p>
        )}
      </div>

      <button type="submit" className="btn-primary" disabled={disabled || submitting}>
        {submitting ? "Entrando..." : "Entrar na fila"}
      </button>
    </form>
  );
}
