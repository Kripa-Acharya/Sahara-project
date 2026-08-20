import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Small, reusable UI primitives shared across every page. */

function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ---------- Buttons ----------

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all " +
  "duration-200 focus-visible:outline-3 disabled:opacity-50 disabled:pointer-events-none " +
  "text-center active:scale-[0.98]";

const buttonVariants = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow",
  secondary: "bg-primary-50 text-primary-800 hover:bg-primary-100 border border-primary-200",
  outline: "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
  ghost: "text-stone-600 hover:bg-stone-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
  leaf: "bg-leaf-600 text-white hover:bg-leaf-700 shadow-sm",
  coral: "bg-coral-500 text-white hover:bg-coral-600 shadow-sm hover:shadow",
} as const;

const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3.5 text-lg",
  xl: "px-8 py-5 text-xl",
} as const;

type ButtonStyleProps = {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & ButtonStyleProps) {
  return (
    <button
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonStyleProps) {
  return (
    <Link
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

// ---------- Layout ----------

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx(
        "rounded-[22px] bg-white border border-line shadow-[0_1px_3px_rgba(35,59,58,0.06)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("p-5 sm:p-6", className)} {...props} />;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-800">{title}</h1>
        {subtitle && <p className="mt-1 text-stone-500 max-w-2xl">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardBody className="text-center py-12">
        <div className="text-5xl mb-3" aria-hidden>
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-stone-700">{title}</h3>
        {body && <p className="mt-1 text-stone-500 max-w-md mx-auto">{body}</p>}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </CardBody>
    </Card>
  );
}

// ---------- Forms ----------

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cx("block text-sm font-semibold text-stone-700 mb-1.5", className)}
      {...props}
    />
  );
}

const fieldBase =
  "w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-stone-800 " +
  "placeholder:text-stone-400 focus:border-primary-400";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(fieldBase, "min-h-24", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(fieldBase, className)} {...props} />;
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-stone-500">{children}</p>;
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-xl bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 text-sm"
    >
      {message}
    </div>
  );
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 text-sm"
    >
      {message}
    </div>
  );
}

// ---------- Display ----------

export function Badge({
  tone,
  className,
  ...props
}: ComponentProps<"span"> & { tone: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-0.5 text-sm font-semibold whitespace-nowrap",
        tone,
        className,
      )}
      {...props}
    />
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "size-8 text-xs", md: "size-11 text-sm", lg: "size-16 text-xl" };
  const abbr = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={cx(
        "inline-flex items-center justify-center rounded-full bg-coral-100 text-coral-700 font-bold shrink-0",
        sizes[size],
      )}
    >
      {abbr}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <Badge tone="bg-leaf-100 text-leaf-700 border border-leaf-200/70">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden className="mr-1">
        <circle cx="7" cy="7" r="7" fill="var(--color-leaf-600)" />
        <path d="M4 7.2 L6.2 9.4 L10 5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      Verified Companion
    </Badge>
  );
}

export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3">
      <strong>Demo:</strong> {children}
    </p>
  );
}

export function DescriptionItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-stone-500">{label}</dt>
      <dd className="text-stone-800">{children}</dd>
    </div>
  );
}
