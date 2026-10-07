import { cn } from "@/lib/utils";
import type { Card } from "@/lib/demo/types";

export function CardVisual({ card, holder, reveal }: { card: Card; holder: string; reveal: boolean }) {
  const groups = card.number.match(/.{1,4}/g) ?? [];
  const shown = reveal ? groups.join(" ") : `•••• •••• •••• ${card.last4}`;
  const styles = {
    virtual: "bg-gradient-to-br from-accent/90 via-info to-bg text-fg",
    plastic: "bg-gradient-to-br from-surface via-band to-bg text-fg border border-line",
    metal: "bg-gradient-to-br from-muted via-surface to-bg text-fg",
  } as const;
  return (
    <div
      className={cn(
        "relative aspect-[1.586] w-full overflow-hidden rounded-[18px] p-5 shadow-[0_12px_32px_-12px_var(--color-accent)]",
        styles[card.type],
        card.status === "frozen" && "grayscale",
      )}
      aria-label={`${card.type} card ending ${card.last4}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-[20px] font-bold tracking-tight">
          Jom<span className={card.type === "virtual" ? "text-on-accent" : "text-accent"}>Bit</span>
        </span>
        <span className="rounded-full bg-bg/60 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">{card.type}</span>
      </div>
      <div className="absolute left-5 top-[42%] h-8 w-11 rounded-[6px] bg-warning/80" aria-hidden />
      <p className="tabular absolute bottom-14 left-5 font-mono text-[19px] tracking-wider">{shown}</p>
      <div className="tabular absolute bottom-4 left-5 right-5 flex items-end justify-between text-[12px]">
        <span className="uppercase">{holder}</span>
        <span>
          EXP {card.expiry}
          {reveal ? <span className="ml-3">CVV {card.cvv}</span> : null}
        </span>
      </div>
      {card.status === "frozen" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/50 text-[18px] font-bold uppercase tracking-widest">Frozen</div>
      ) : null}
    </div>
  );
}
