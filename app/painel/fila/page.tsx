import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BarberQueueDashboard } from "@/components/BarberQueueDashboard";

export default async function PainelFilaPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!barbershop) redirect("/painel");

  return (
    <BarberQueueDashboard
      barbershopId={barbershop.id}
      barbershopName={barbershop.name}
    />
  );
}
