export type PhotoDef = { file: string; alt: string; label: string; /** CSS object-position when the subject is off-centre. */ focus?: string };

/**
 * Every photo slot on the site, served from public/images/. A missing file shows a styled placeholder with the
 * slot's label instead. PHOTOS.md lists the source of each photo.
 */
export const PHOTOS = {
  hero: { file: "hero.jpg", alt: "Žena s dlhými zvlnenými vlasmi pred ružovou stenou", label: "Hero", focus: "50% 35%" },
  interior: { file: "interior.jpg", alt: "Ružové kreslá pred veľkým zrkadlom v salóne", label: "Salón" },
  interior2: { file: "interior-2.jpg", alt: "Svetlý salón s okrúhlymi zrkadlami a mramorovou podlahou", label: "Salón 2" },
  teamGroup: { file: "team-group.jpg", alt: "Tri kaderníčky s nožnicami a kefami sa smejú", label: "Tím" },
  hairBlowdry: { file: "hair-blowdry.jpg", alt: "Kaderníčka fúka klientke krátke vlasy", label: "Fúkaná", focus: "62% 40%" },
  hairStyling: { file: "hair-styling.jpg", alt: "Styling vlasov kefou a fénom", label: "Styling" },
  hairColor: { file: "hair-color.jpg", alt: "Dlhé levanduľové vlnité vlasy", label: "Farbenie", focus: "50% 30%" },
  hairBob: { file: "hair-bob.jpg", alt: "Žena s medeným mikádom pri jazere", label: "Mikádo", focus: "50% 30%" },
  nailsSoft: { file: "nails-soft.jpg", alt: "Nechty v sivej a bielej farbe na pletenom svetri", label: "Nechty" },
  nailsNude: { file: "nails-nude.jpg", alt: "Nude manikúra na jemnej kožušine", label: "Nude manikúra" },
  nailsDark: { file: "nails-dark.jpg", alt: "Čierne a korytnačie nechty s prsteňmi", label: "Tmavé nechty" },
  nailsWork: { file: "nails-work.jpg", alt: "Nechtová dizajnérka pracuje na manikúre", label: "Manikúra" },
  lashes: { file: "lashes.jpg", alt: "Aplikácia predĺžených mihalníc pinzetou", label: "Mihalnice" },
  facialMask: { file: "facial-mask.jpg", alt: "Nanášanie hnedej masky na tvár štetcom", label: "Maska" },
  facial: { file: "facial.jpg", alt: "Klientka s bielou maskou počas ošetrenia pleti", label: "Ošetrenie pleti" },
  makeup: { file: "makeup.jpg", alt: "Nanášanie rúžu pri líčení", label: "Líčenie" },
  brushes: { file: "brushes.jpg", alt: "Štetce na líčenie v jemných ružových tónoch", label: "Štetce" },
  massage: { file: "massage.jpg", alt: "Masáž chrbta s teplým olejom", label: "Masáž" },
  stones: { file: "stones.jpg", alt: "Lávové kamene na chrbte a biele orchidey", label: "Lávové kamene" },
  spaStill: { file: "spa-still.jpg", alt: "Uterák, sviečka, tulipány a fľaša oleja", label: "Wellness" },
  tools: { file: "tools.jpg", alt: "Ruky držia kefy, nožnice a hrebene", label: "Náradie" },
  team1: { file: "team-1.jpg", alt: "Portrét usmievavej ženy s drdolom", label: "Veronika", focus: "50% 25%" },
  team2: { file: "team-2.jpg", alt: "Portrét ženy s dlhými tmavými vlasmi", label: "Simona", focus: "50% 22%" },
  team3: { file: "team-3.jpg", alt: "Portrét ženy s tmavými vlasmi na tmavom pozadí", label: "Laura", focus: "38% 40%" },
  team4: { file: "team-4.jpg", alt: "Portrét usmievavej ženy v bordovom svetri", label: "Natália", focus: "50% 25%" },
  team5: { file: "team-5.jpg", alt: "Portrét blondínky v záhrade pri západe slnka", label: "Eva", focus: "45% 35%" },
  team6: { file: "team-6.jpg", alt: "Portrét usmievavého muža v bielom tričku", label: "Tomáš", focus: "50% 25%" },
  team7: { file: "look-1.jpg", alt: "Portrét ženy s gaštanovými vlasmi pri okne", label: "Kristína", focus: "50% 25%" },
  look2: { file: "look-2.jpg", alt: "Žena s dlhými hnedými vlasmi pri západe slnka", label: "Look 2", focus: "50% 30%" },
  look3: { file: "look-3.jpg", alt: "Žena s objemnými prírodnými kučerami", label: "Look 3" },
  look4: { file: "look-4.jpg", alt: "Žena s krátkymi vlasmi a žiarivou pleťou", label: "Look 4", focus: "50% 30%" },
  look5: { file: "look-5.jpg", alt: "Žena s drdolom a pehami na lícach", label: "Look 5", focus: "50% 35%" },
  look6: { file: "look-6.jpg", alt: "Žena s uhladenými vlasmi vo fialovom svetle", label: "Look 6", focus: "50% 30%" },
} satisfies Record<string, PhotoDef>;

export type PhotoKey = keyof typeof PHOTOS;

export const photoSrc = (key: PhotoKey) => `/images/${PHOTOS[key].file}`;
