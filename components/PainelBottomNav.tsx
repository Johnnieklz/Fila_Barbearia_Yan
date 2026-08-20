"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { href: "/painel/fila", label: "Fila" },
  { href: "/painel/configuracoes", label: "Ajustes" },
];

export function PainelBottomNav() {
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Recarrega a página inteira (em vez de router.push + router.refresh)
    // para garantir que nenhum estado de sessão antigo fique em cache no
    // lado do cliente.
    window.location.href = "/login";
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-700 bg-ink-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 py-3.5 text-center text-sm font-medium transition ${
                active ? "text-gold-400" : "text-muted"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex-1 py-3.5 text-center text-sm font-medium text-muted transition hover:text-bad"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
