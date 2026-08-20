import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PublicQueueView } from "@/components/PublicQueueView";

interface PageProps {
  params: { slug: string };
}

// Permite que a página pública funcione mesmo com dados sendo alterados
// com frequência (fila muda o tempo todo) — o conteúdo em si é buscado
// no cliente via Realtime, então isso só afeta a metade "estática" inicial.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!barbershop) {
    return { title: "Fila não encontrada" };
  }

  return {
    title: `Fila — ${barbershop.name}`,
    description: `Acompanhe a fila da ${barbershop.name} em tempo real.`,
  };
}

export default async function FilaPublicaPage({ params }: PageProps) {
  const supabase = createClient();
  const { data: barbershop, error } = await supabase
    .from("barbershops")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error || !barbershop) {
    notFound();
  }

  return <PublicQueueView barbershop={barbershop} />;
}
