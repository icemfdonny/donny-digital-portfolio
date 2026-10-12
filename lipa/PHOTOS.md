# Photos

All 28 photos are from [Unsplash](https://unsplash.com) and fall under the [Unsplash License](https://unsplash.com/license): free for commercial use, no attribution required. Each one was checked by eye for its slot, resized to about 1600 px on the long side (the hero to 2400 px) and compressed to roughly 80–440 KB.

The slots are defined in `src/data/photos.ts` (file name, Slovak alt text, and an optional focal point for cropping). A slot whose file is missing shows a dark green placeholder with its label.

## Replacing a photo

1. Save the new image under the same file name in `public/images/`. Aim for 1600 px on the long side and under ~300 KB (squoosh.app works well).
2. If the subject is off-centre, set `focus` for that slot in `src/data/photos.ts`, e.g. `focus: "70% 40%"`.
3. Update the alt text in the same file so it describes the new photo.

To give a dish without a photo one (bryndzové halušky and pečená cvikla currently have none), add a slot to `PHOTOS` and set `photo` on the dish in `src/data/menu.ts`.

## Sources

| File | Used for | Size | Source |
|---|---|---|---|
| `hero.jpg` | Homepage hero | 2400×1600 · 438 KB | https://images.unsplash.com/photo-1517248135467-4c7edcad34c4 |
| `interior.jpg` | Spaces, About | 1200×1600 · 282 KB | https://images.unsplash.com/photo-1537047902294-62a40c20a6ae |
| `bar.jpg` | Spaces (vínny bar) | 1067×1600 · 279 KB | https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb |
| `terrace.jpg` | Spaces, Navštívte nás | 1600×1067 · 285 KB | https://images.unsplash.com/photo-1600093463592-8e36ae95ef56 |
| `private-room.jpg` | Spaces (salónik) | 1600×1067 · 179 KB | https://images.unsplash.com/photo-1574966739987-65e38db0f7ce |
| `kitchen.jpg` | Homepage story, About gallery | 1600×1067 · 223 KB | https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf |
| `chef.jpg` | About, team | 1039×1600 · 212 KB | https://images.unsplash.com/photo-1577219491135-ce391730fb2c |
| `sommelier.jpg` | About, team | 1067×1600 · 237 KB | https://images.unsplash.com/photo-1553361371-9b22f78e8b1d |
| `manager.jpg` | About, team | 1600×1201 · 169 KB | https://images.unsplash.com/photo-1556745753-b2904692b3cd |
| `farm.jpg` | About, suppliers | 1067×1600 · 260 KB | https://images.unsplash.com/photo-1563865436874-9aef32095fad |
| `dish-tartare.jpg` | Tatarák | 1600×1067 · 250 KB | https://images.unsplash.com/photo-1615937691194-97dbd3f3dc29 |
| `dish-cheese.jpg` | Syry slovenských farmárov | 1600×1068 · 226 KB | https://images.unsplash.com/photo-1452195100486-9cc805987862 |
| `dish-duck.jpg` | Pečená kačica pre dvoch | 1068×1600 · 271 KB | https://images.unsplash.com/photo-1598103442097-8b74394b95c6 |
| `dish-cheeks.jpg` | Hovädzie líčka | 1060×1600 · 225 KB | https://images.unsplash.com/photo-1432139509613-5c4255815697 |
| `dish-fish.jpg` | Zubáč na masle | 1067×1600 · 182 KB | https://images.unsplash.com/photo-1467003909585-2f8a72700288 |
| `dish-burger.jpg` | Lipa burger | 1600×1329 · 213 KB | https://images.unsplash.com/photo-1568901346375-23c9450c58cd |
| `dish-steak.jpg` | Rib-eye steak | 1600×1067 · 292 KB | https://images.unsplash.com/photo-1546964124-0cce460f38ef |
| `dish-dessert.jpg` | Čokoládový fondant | 1600×1067 · 203 KB | https://images.unsplash.com/photo-1624353365286-3f8d62daad51 |
| `dish-risotto.jpg` | Rizoto s lesnými hubami | 1600×1068 · 80 KB | https://images.unsplash.com/photo-1476124369491-e7addf5db371 |
| `dish-pork.jpg` | Bravčová panenka | 1600×1060 · 250 KB | https://images.unsplash.com/photo-1432139555190-58524dae6a55 |
| `dish-flank.jpg` | Flank steak | 1600×900 · 205 KB | https://images.unsplash.com/photo-1558030006-450675393462 |
| `event-wine.jpg` | Vínny štvrtok | 1600×1067 · 144 KB | https://images.unsplash.com/photo-1519671482749-fd09be7ccebf |
| `event-jazz.jpg` | Jazz pod lipou | 1600×1067 · 244 KB | https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f |
| `event-chef.jpg` | Večer so šéfkuchárom | 1067×1600 · 194 KB | https://images.unsplash.com/photo-1572715376701-98568319fd0b |
| `event-valentine.jpg` | Valentínska večera | 1600×1067 · 245 KB | https://images.unsplash.com/photo-1414235077428-338989a2e8c0 |
| `event-bread.jpg` | Kurz kváskového chleba | 1600×1064 · 313 KB | https://images.unsplash.com/photo-1509440159596-0249088772ff |
| `event-goose.jpg` | Martinská hus | 1600×1067 · 270 KB | https://images.unsplash.com/photo-1606728035253-49e8a23146de |
| `event-new-year.jpg` | Silvester | 1600×1068 · 75 KB | https://images.unsplash.com/photo-1467810563316-b5476525c0f9 |
