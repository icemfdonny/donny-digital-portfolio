type IconProps = { className?: string };

/** Icon-only crop of the brand mark (browser chrome + duotone "DD"). */
export function LogoIcon({ className = "" }: IconProps) {
  return <img src="/logo-icon.png" alt="" className={`object-contain ${className}`} />;
}

/** Full lockup: icon + "DONNY DIGITAL" wordmark + orange underline. */
export default function Logo({ className = "" }: IconProps) {
  return (
    <img
      src="/logo-full.png"
      alt="Donny Digital"
      className={`object-contain ${className}`}
    />
  );
}
