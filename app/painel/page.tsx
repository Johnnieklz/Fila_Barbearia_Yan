import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateBarbershopForm } from "@/components/CreateBarbershopForm";

export default async function PainelPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O middleware já garante que há um usuário logado aqui, mas
  // verificamos de novo por segurança/tipagem.
  if (!user) {
    redirect("/login");
  }

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (barbershop) {
    redirect("/painel/fila");
  }

  return <CreateBarbershopForm ownerId={user.id} />;
}
