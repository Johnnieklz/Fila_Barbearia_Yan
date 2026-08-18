"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isValidSlug, slugify } from "@/lib/slug";
import { ErrorBanner } from "@/components/ErrorBanner";

interface CreateBarbershopFormProps {
  ownerId: string;
}

export function CreateBarbershopForm({ ownerId }: CreateBarbershopFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const finalSlug = slugify(slug);
    if (name.trim().length < 2) {
      setError("Digite o nome da barbearia.");
      return;
    }
    if (!isValidSlug(finalSlug)) {
      setError("O link precisa ter ao menos 3 letras/números, sem espaços ou símbolos.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    const { error: insertError } = await supabase.from("barbershops").insert({
      owner_id: ownerId,
      name: name.trim(),
      slug: finalSlug,
      queue_open: false,
      average_service_minutes: 30,
    });

    if (insertError) {
      setSubmitting(false);
      if (insertError.code === "23505") {
        setError("Esse link já está em uso. Escolha outro.");
      } else {
        setError("Não foi possível criar a barbearia. Tente novamente.");
      }
      return;
    }

    router.push("/painel/fila");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-cream">
        Vamos criar sua barbearia
      </h1>
      <p className="mt-1 text-sm text-muted">
        Esses dados aparecerão para os clientes na página pública da fila.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <div>
          <label htmlFor="shop-name" className="mb-1.5 block text-sm text-muted">
            Nome da barbearia
          </label>
          <input
            id="shop-name"
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="field-input"
            placeholder="Ex: Barbearia do João"
            maxLength={80}
          />
        </div>

        <div>
          <label htmlFor="shop-slug" className="mb-1.5 block text-sm text-muted">
            Link público da fila
          </label>
          <div className="flex items-center overflow-hidden rounded-2xl border border-ink-700 bg-ink-950 focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-500/30">
            <span className="pl-4 text-sm text-muted">/fila/</span>
            <input
              id="shop-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className="w-full bg-transparent py-3.5 pr-4 text-base text-cream outline-none"
              placeholder="barbearia-do-joao"
              maxLength={60}
            />
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        <button type="submit" className="btn-primary mt-2" disabled={submitting}>
          {submitting ? "Criando..." : "Criar barbearia"}
        </button>
      </form>
    </main>
  );
}
