interface PositionBadgeProps {
  position: number;
  calledNow?: boolean;
}

/**
 * Elemento de assinatura da identidade visual: um emblema circular com
 * listras diagonais (referência ao poste giratório de barbearia) exibindo
 * a posição do cliente. Quando `calledNow` é true, pulsa em dourado para
 * comunicar "é a sua vez" sem precisar de texto extra.
 */
export function PositionBadge({ position, calledNow = false }: PositionBadgeProps) {
  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
      <div
        className={`absolute inset-0 rounded-full ${
          calledNow ? "animate-pulseRing" : ""
        }`}
        style={{
          background:
            "repeating-conic-gradient(from 0deg, #A83A32 0deg 20deg, #F3ECDF 20deg 40deg, #2E4A5E 40deg 60deg)",
        }}
        aria-hidden
      />
      <div className="absolute inset-[6px] rounded-full bg-ink-950" aria-hidden />
      <div className="relative flex flex-col items-center">
        <span className="font-display text-6xl font-semibold leading-none text-cream">
          {calledNow ? "!" : `#${position}`}
        </span>
        {calledNow && (
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-gold-400">
            sua vez
          </span>
        )}
      </div>
    </div>
  );
}
