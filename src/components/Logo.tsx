type LogoProps = { className?: string };

/** Full "D · Donny-Digital" wordmark (white on transparent). */
export default function Logo({ className = "" }: LogoProps) {
  return <img src="/brand/wordmark.png" alt="Donny-Digital" className={`w-auto select-none ${className}`} draggable={false} />;
}

/** The "D" monogram on its own. */
export function LogoMark({ className = "", alt = "" }: LogoProps & { alt?: string }) {
  return <img src="/brand/mark.png" alt={alt} className={`w-auto select-none ${className}`} draggable={false} />;
}
