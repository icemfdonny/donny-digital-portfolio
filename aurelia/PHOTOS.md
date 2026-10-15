# Photos

All 33 photos are from [Unsplash](https://unsplash.com) and fall under the [Unsplash License](https://unsplash.com/license): free for commercial use, no attribution required. Each one was checked by eye for its slot and resized to 1000–1600 px on the long side (the hero to 2400 px).

The slots are defined in `src/data/photos.ts` (file name, Slovak alt text, a short label, and an optional focal point for cropping). A slot whose file is missing shows a plum placeholder with its label, so the site still looks finished.

## Replacing a photo

1. Save the new image under the same file name in `public/images/`. Aim for 1600 px on the long side and under ~300 KB (squoosh.app works well).
2. If the subject is off-centre, set `focus` for that slot in `src/data/photos.ts`, e.g. `focus: "70% 40%"`.
3. Update the alt text in the same file so it describes the new photo.

For a real salon, swap the team portraits (`team-*.jpg`) and the gallery looks (`look-*.jpg`) for the salon's own work first: they carry the most trust.

## Sources

| File | Slot | Size | Source |
|---|---|---|---|
| `hero.jpg` | Hero | 2400×1602 · 343 KB | https://images.unsplash.com/photo-1522337360788-8b13dee7a37e |
| `interior.jpg` | Salón | 1600×1067 · 171 KB | https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f |
| `interior-2.jpg` | Salón 2 | 1600×1067 · 238 KB | https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6 |
| `team-group.jpg` | Tím | 1600×1068 · 318 KB | https://images.unsplash.com/photo-1559599101-f09722fb4948 |
| `hair-blowdry.jpg` | Fúkaná | 1600×1068 · 232 KB | https://images.unsplash.com/photo-1562322140-8baeececf3df |
| `hair-styling.jpg` | Styling | 1600×1068 · 184 KB | https://images.unsplash.com/photo-1580618672591-eb180b1a973f |
| `hair-color.jpg` | Farbenie | 1200×1800 · 312 KB | https://images.unsplash.com/photo-1492106087820-71f1a00d2b11 |
| `hair-bob.jpg` | Mikádo | 1600×1067 · 116 KB | https://images.unsplash.com/photo-1438761681033-6461ffad8d80 |
| `nails-soft.jpg` | Nechty | 1200×1200 · 121 KB | https://images.unsplash.com/photo-1607779097040-26e80aa78e66 |
| `nails-nude.jpg` | Nude manikúra | 1600×900 · 118 KB | https://images.unsplash.com/photo-1610992015732-2449b76344bc |
| `nails-dark.jpg` | Tmavé nechty | 1200×1800 · 172 KB | https://images.unsplash.com/photo-1604654894610-df63bc536371 |
| `nails-work.jpg` | Manikúra | 1600×1067 · 124 KB | https://images.unsplash.com/photo-1632345031435-8727f6897d53 |
| `lashes.jpg` | Mihalnice | 1200×1800 · 176 KB | https://images.unsplash.com/photo-1589710751893-f9a6770ad71b |
| `facial-mask.jpg` | Maska | 1600×1067 · 236 KB | https://images.unsplash.com/photo-1570172619644-dfd03ed5d881 |
| `facial.jpg` | Ošetrenie pleti | 1600×1067 · 161 KB | https://images.unsplash.com/photo-1616394584738-fc6e612e71b9 |
| `makeup.jpg` | Líčenie | 1600×1067 · 206 KB | https://images.unsplash.com/photo-1487412947147-5cebf100ffc2 |
| `brushes.jpg` | Štetce | 1600×1067 · 151 KB | https://images.unsplash.com/photo-1526045478516-99145907023c |
| `massage.jpg` | Masáž | 1600×1067 · 171 KB | https://images.unsplash.com/photo-1544161515-4ab6ce6db874 |
| `stones.jpg` | Lávové kamene | 1600×1067 · 128 KB | https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2 |
| `spa-still.jpg` | Wellness | 1600×1067 · 189 KB | https://images.unsplash.com/photo-1540555700478-4be289fbecef |
| `tools.jpg` | Náradie | 1600×1068 · 90 KB | https://images.unsplash.com/photo-1595475884562-073c30d45670 |
| `team-1.jpg` | Veronika | 1000×1258 · 111 KB | https://images.unsplash.com/photo-1580489944761-15a19d654956 |
| `team-2.jpg` | Simona | 1000×1500 · 146 KB | https://images.unsplash.com/photo-1567532939604-b6b5b0db2604 |
| `team-3.jpg` | Laura | 1000×667 · 75 KB | https://images.unsplash.com/photo-1607746882042-944635dfe10e |
| `team-4.jpg` | Natália | 1000×1500 · 103 KB | https://images.unsplash.com/photo-1494790108377-be9c29b29330 |
| `team-5.jpg` | Eva | 1200×800 · 129 KB | https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91 |
| `team-6.jpg` | Tomáš | 1000×1500 · 132 KB | https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d |
| `look-1.jpg` | Kristína | 1200×1800 · 258 KB | https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e |
| `look-2.jpg` | Look 2 | 1200×1798 · 382 KB | https://images.unsplash.com/photo-1544005313-94ddf0286df2 |
| `look-3.jpg` | Look 3 | 1200×1200 · 135 KB | https://images.unsplash.com/photo-1519699047748-de8e457a634e |
| `look-4.jpg` | Look 4 | 1200×1800 · 285 KB | https://images.unsplash.com/photo-1531123897727-8f129e1688ce |
| `look-5.jpg` | Look 5 | 1200×1805 · 283 KB | https://images.unsplash.com/photo-1554151228-14d9def656e4 |
| `look-6.jpg` | Look 6 | 1200×1500 · 139 KB | https://images.unsplash.com/photo-1534528741775-53994a69daeb |
