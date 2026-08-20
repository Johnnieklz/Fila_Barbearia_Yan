"use client";

import { useState } from "react";

interface AddCustomerModalProps {
  open: boolean;
  onAdd: (name: string) => Promise<void>;
  onClose: () => void;
}

export function AddCustomerModal({ open, onAdd, onClose }: AddCustomerModalProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Digite um nome válido.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onAdd(trimmed);
      setName("");
      onClose();
    } catch {
      setError("Não foi possível adicionar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        className="surface-card w-full max-w-sm animate-riseIn"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="font-display text-xl font-semibold text-cream">
          Adicionar cliente
        </h2>
        <p className="mt-1 text-sm text-muted">
          Para clientes que chegaram sem escanear o QR Code.
        </p>

        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do cliente"
          className="field-input mt-4"
          maxLength={60}
          disabled={submitting}
        />
        {error && <p className="mt-1.5 text-sm text-bad">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </form>
    </div>
  );
}
