import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BarbershopSettingsForm } from "@/components/BarbershopSettingsForm";

export default async function PainelConfiguracoesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!barbershop) redirect("/painel");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const publicUrl = `${siteUrl}/fila/${barbershop.slug}`;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold text-cream">Ajustes</h1>
      <BarbershopSettingsForm barbershop={barbershop} publicUrl={publicUrl} />
    </div>
  );
}
