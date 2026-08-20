"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log técnico apenas no console — o usuário final nunca vê isso.
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="bg-ink-950 text-cream">
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-display text-2xl font-semibold">
            Algo deu errado
          </h1>
          <p className="text-sm text-muted">
            Não conseguimos carregar esta página agora. Verifique sua conexão
            e tente novamente.
          </p>
          <button onClick={reset} className="btn-primary w-full">
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
