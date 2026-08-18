import Link from "next/link";

export default function FilaNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-2xl font-semibold text-cream">
        Fila não encontrada
      </h1>
      <p className="text-sm text-muted">
        Verifique se o link ou QR Code está correto, ou fale com o
        barbeiro para confirmar o endereço da fila.
      </p>
      <Link href="/" className="btn-secondary mt-3 w-full">
        Voltar ao início
      </Link>
    </main>
  );
}
