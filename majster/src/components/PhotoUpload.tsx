import { useId, useState } from "react";
import { Camera, Trash } from "./icons";

const MAX = 4;

/** Shrinks a photo in the browser so it fits the demo's storage (a real site would upload the original). */
function shrink(file: File, size = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, size / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("not an image"));
    };
    img.src = url;
  });
}

export function PhotoUpload({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const room = MAX - value.length;
    const picked = [...files].filter((f) => f.type.startsWith("image/")).slice(0, room);
    try {
      const shrunk = await Promise.all(picked.map((f) => shrink(f)));
      onChange([...value, ...shrunk]);
      if (files.length > room) setError(`Stačia ${MAX} fotky, ostatné sme vynechali.`);
    } catch {
      setError("Jednu z fotiek sa nepodarilo načítať. Skúste iný súbor.");
    }
    setBusy(false);
  };

  return (
    <div>
      <p className="field-label">Fotky (nepovinné)</p>
      <div className="grid grid-cols-4 gap-2">
        {value.map((src, i) => (
          <div key={src.slice(-40) + i} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-sand">
            <img src={src} alt={`Vaša fotka ${i + 1}`} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-ink/80 text-white opacity-90 hover:bg-danger"
              aria-label={`Odstrániť fotku ${i + 1}`}
            >
              <Trash size={14} />
            </button>
          </div>
        ))}
        {value.length < MAX && (
          <label
            htmlFor={id}
            className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-line bg-paper text-center text-xs font-semibold text-soft transition-colors hover:border-ink/40 hover:text-ink"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void add(e.dataTransfer.files);
            }}
          >
            <span className="flex flex-col items-center gap-1.5 px-1">
              <Camera size={22} />
              {busy ? "Načítavam…" : "Pridať fotku"}
            </span>
          </label>
        )}
      </div>
      <input id={id} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => {
          void add(e.target.files);
          e.target.value = "";
        }} />
      <p className="mt-1.5 text-sm text-mute">{error ?? "Fotka miesta alebo problému nám pomôže naceniť presnejšie."}</p>
    </div>
  );
}
