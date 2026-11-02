import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost" | "danger";

const STYLES: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  outline: "border border-line bg-surface text-ink hover:bg-brand-soft",
  ghost: "text-ink hover:bg-brand-soft",
  danger: "bg-danger text-white hover:opacity-90",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({
  variant = "primary",
  className = "",
  ...props
}: Props) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${STYLES[variant]} ${className}`}
    />
  );
}
