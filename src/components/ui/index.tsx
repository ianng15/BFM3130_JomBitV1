"use client";

/**
 * Small shadcn/ui-style primitives styled with the DESIGN.md tokens.
 */
import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { CURRENCY_PREFIX, minorDigits, minorToDecimalString, type CurrencyCode } from "@/lib/ledger/money";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";

const variantClass: Record<Variant, string> = {
  primary: "bg-accent text-on-accent font-semibold hover:brightness-110",
  secondary: "border border-line bg-surface text-fg hover:bg-line",
  ghost: "bg-transparent text-accent hover:bg-surface/60",
  danger: "bg-danger text-fg hover:brightness-110",
  success: "bg-success text-fg hover:brightness-110",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "sm";
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", block, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[12px] transition duration-150 disabled:cursor-not-allowed disabled:opacity-40",
        size === "md" ? "min-h-12 whitespace-nowrap px-4 text-[15px]" : "min-h-11 whitespace-nowrap px-4 text-sm",
        block && "w-full",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
});

export function ButtonLink({
  href,
  variant = "secondary",
  size = "md",
  block,
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: "md" | "sm";
  block?: boolean;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[12px] transition duration-150",
        size === "md" ? "min-h-12 whitespace-nowrap px-4 text-[15px]" : "min-h-11 whitespace-nowrap px-4 text-sm",
        block && "w-full",
        variantClass[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-[16px] bg-surface p-4", className)} {...props}>
      {children}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "min-h-12 w-full rounded-[12px] border border-line bg-surface px-4 text-[15px] text-fg placeholder:text-muted focus:border-accent focus:outline-none",
        className,
      )}
      {...props}
    />
  );
});

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-12 w-full appearance-none rounded-[12px] border border-line bg-surface px-4 text-[15px] text-fg focus:border-accent focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint ? <span className="block text-[12px] text-muted">{hint}</span> : null}
    </label>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-0.5 text-[11px] font-semibold text-on-accent",
        className,
      )}
    >
      Demo — simulated
    </span>
  );
}

export function Pill({ tone, children, className }: { tone: "success" | "danger" | "warning" | "info" | "muted"; children: ReactNode; className?: string }) {
  const tones = {
    success: "bg-success text-fg",
    danger: "bg-danger text-fg",
    warning: "bg-warning text-on-accent",
    info: "bg-info text-fg",
    muted: "bg-surface text-muted",
  } as const;
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold", tones[tone], className)}>{children}</span>;
}

const avatarBg = ["bg-avatar-0", "bg-avatar-1", "bg-avatar-2", "bg-avatar-3", "bg-avatar-4", "bg-avatar-5"];

export function Avatar({
  name,
  colour = 0,
  size = 40,
  selected,
  className,
}: {
  name: string;
  colour?: number;
  size?: number;
  selected?: boolean;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-on-accent",
        avatarBg[colour % avatarBg.length],
        selected && "ring-2 ring-accent ring-offset-2 ring-offset-bg",
        className,
      )}
    >
      {initials}
    </span>
  );
}

/** Large money display: muted currency prefix + tabular number. */
export function Amount({
  minor,
  currency,
  className,
  size = "hero",
  tone,
  sign,
}: {
  minor: number;
  currency: string;
  className?: string;
  size?: "hero" | "lg" | "md";
  tone?: "success" | "danger";
  sign?: boolean;
}) {
  const digits = minorDigits(currency);
  const plain = minorToDecimalString(Math.abs(minor), digits);
  const [whole, frac] = plain.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const prefix = CURRENCY_PREFIX[currency as CurrencyCode] ?? currency;
  const signChar = minor < 0 ? "−" : sign && minor > 0 ? "+" : "";
  const sizes = { hero: "text-[38px] font-bold", lg: "text-[26px] font-bold", md: "text-[18px] font-semibold" };
  const tones = { success: "text-success-text", danger: "text-danger-text" };
  return (
    <span className={cn("tabular inline-flex items-baseline gap-1 leading-none", sizes[size], tone && tones[tone], className)}>
      <span className="text-[0.5em] font-medium text-muted">
        {signChar}
        {prefix}
      </span>
      <span>
        {grouped}
        {frac !== undefined ? <span className="text-[0.7em]">.{frac}</span> : null}
      </span>
    </span>
  );
}

export function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[16px] border border-dashed border-line px-6 py-8 text-center">
      <p className="text-[15px] text-muted">{text}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[12px] bg-surface", className)} />;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted">{children}</h2>
      {action}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warning" | "danger" | "success"; children: ReactNode }) {
  const tones = {
    info: "border-info text-info-text",
    warning: "border-warning text-warning",
    danger: "border-danger text-danger-text",
    success: "border-success text-success-text",
  };
  return <div className={cn("rounded-[12px] border bg-surface-2 px-4 py-3 text-[13px] leading-relaxed", tones[tone])}>{children}</div>;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-[12px] bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-10 flex-1 rounded-[10px] text-sm font-medium transition",
            value === o.value ? "bg-bg text-accent" : "text-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ListRow({
  left,
  title,
  subtitle,
  right,
  href,
  onClick,
}: {
  left?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      {left}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium">{title}</div>
        {subtitle ? <div className="truncate text-[13px] text-muted">{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0 text-right">{right}</div> : null}
    </>
  );
  const cls = "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left";
  if (href)
    return (
      <Link href={href} className={cn(cls, "hover:bg-line/40")}>
        {inner}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cn(cls, "hover:bg-line/40")}>
        {inner}
      </button>
    );
  return <div className={cls}>{inner}</div>;
}

export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("divide-y divide-line overflow-hidden rounded-[16px] bg-surface", className)}>{children}</div>;
}
