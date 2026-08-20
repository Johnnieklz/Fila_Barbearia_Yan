import { PainelBottomNav } from "@/components/PainelBottomNav";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">{children}</div>
      <PainelBottomNav />
    </div>
  );
}
