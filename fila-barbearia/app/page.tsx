import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-between px-6 py-12">
      <div className="mt-16 flex flex-col items-center text-center">
        <div
          className="mb-6 h-16 w-16 rounded-full"
          style={{
            background:
              "repeating-conic-gradient(from 0deg, #A83A32 0deg 20deg, #F3ECDF 20deg 40deg, #2E4A5E 40deg 60deg)",
          }}
          aria-hidden
        />
        <h1 className="font-display text-3xl font-semibold leading-tight text-cream">
          Fila da Barbearia
        </h1>
        <p className="mt-3 text-muted">
          Sem aplicativo, sem cadastro. O cliente escaneia o QR Code e
          acompanha a própria posição em tempo real.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/login" className="btn-primary text-center">
          Sou barbeiro
        </Link>
        <p className="text-center text-xs text-muted">
          Cliente? Escaneie o QR Code da barbearia ou peça o link ao
          barbeiro.
        </p>
      </div>
    </main>
  );
}
