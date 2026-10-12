# Photos for the Lipa demo

Every photo slot is listed in `src/data/photos.ts`. Save a file with the exact name below into `public/images/` and it appears on the site; until then the slot shows a dark green placeholder with its label.

Tips:

- Unsplash and Pexels photos are free to use commercially without attribution. Download the **large** size, not the original.
- Keep files around **1600–2400 px on the long side** and under ~400 KB (squoosh.app or `cwebp` work well). Use the `.jpg` names below, or change the extensions in `src/data/photos.ts`.
- Photos are cropped with `object-fit: cover`, so keep the subject roughly centred.
- Pick a consistent mood: warm light, dark wood, natural textures. Avoid bright studio-white food shots next to moody interiors.

## Must-have (the homepage and menu use these first)

| File | Where it shows | What to look for | Search terms |
|---|---|---|---|
| `hero.jpg` | Homepage hero, full screen, dark overlay | Dining room or a table at night, warm light, some depth | `restaurant interior night`, `dinner table candle` |
| `dish-tartare.jpg` | Signature dishes, menu | Beef tartare with egg yolk, top-down or 45° | `beef tartare` |
| `dish-halusky.jpg` | Signature dishes, menu | Gnocchi-like dumplings with cheese and bacon (bryndzové halušky) | `bryndzove halusky`, `gnocchi bacon cheese` |
| `dish-duck.jpg` | Signature dishes, menu | Roast duck leg with red cabbage | `roast duck leg` |
| `dish-steak.jpg` | Signature dishes, menu | Sliced rib-eye on a board | `ribeye steak sliced` |
| `dish-dessert.jpg` | Signature dishes, menu | Rustic dessert, poppy seed or pear | `poppy seed dessert`, `pear dessert plate` |
| `kitchen.jpg` | Homepage "Náš príbeh", portrait | Open kitchen, flames or chef plating | `open kitchen fire`, `chef plating` |
| `interior.jpg` | Spaces, About, portrait | Dining room by day, wooden tables | `bistro interior wood` |
| `terrace.jpg` | Spaces, "Navštívte nás" | Courtyard terrace with a tree, string lights | `courtyard restaurant terrace` |
| `bar.jpg` | Spaces | Wine bar counter, bottles on shelves | `wine bar counter` |

## Nice to have

| File | Where it shows | What to look for | Search terms |
|---|---|---|---|
| `private-room.jpg` | Spaces | Long set table in a private room | `private dining room long table` |
| `dish-beetroot.jpg` | Menu | Roasted beetroot with goat cheese | `beetroot goat cheese salad` |
| `dish-cheese.jpg` | Menu | Cheese board with nuts | `cheese board walnuts` |
| `dish-cheeks.jpg` | Menu | Braised beef with mash | `braised beef cheeks puree` |
| `dish-fish.jpg` | Menu | Pan-fried white fish fillet with lentils | `pike perch fillet`, `white fish lentils` |
| `dish-burger.jpg` | Menu, ordering | Burger with fries | `gourmet burger fries` |
| `event-wine.jpg` | Events | Wine tasting, several glasses on a table | `wine tasting table` |
| `event-jazz.jpg` | Events | Small jazz band playing at night | `jazz trio live` |
| `event-chef.jpg` | Events | Chef serving at a chef's table | `chefs table tasting menu` |
| `event-bread.jpg` | Events | Sourdough loaves | `sourdough bread loaf` |
| `event-goose.jpg` | Events (November) | Roast goose | `roast goose` |
| `event-new-year.jpg` | Events (December) | Champagne toast | `champagne toast` |
| `chef.jpg` | About, team, portrait | Chef portrait in the kitchen | `chef portrait kitchen` |
| `sommelier.jpg` | About, team, portrait | Sommelier with a bottle | `sommelier portrait` |
| `manager.jpg` | About, team, portrait | Restaurant manager or host | `restaurant manager portrait` |
| `farm.jpg` | About, suppliers | Crate of fresh vegetables | `vegetables crate farm` |

When the photos are in, regenerate the portfolio screenshots of the site at 1600×1000 for `public/work/` in the portfolio.
