/**
 * Every photo slot on the site. Drop a file with the listed name into public/images/ and it appears; until then a
 * styled placeholder shows the slot's label. PHOTOS.md lists what to look for on Unsplash or Pexels.
 */
export const PHOTOS = {
  hero: { file: "hero.jpg", alt: "Večerná atmosféra v reštaurácii Lipa", label: "Hero · jedáleň večer" },
  interior: { file: "interior.jpg", alt: "Interiér reštaurácie s drevenými stolmi a teplým svetlom", label: "Interiér" },
  bar: { file: "bar.jpg", alt: "Vínny bar s policami plnými fliaš", label: "Vínny bar" },
  terrace: { file: "terrace.jpg", alt: "Terasa vo vnútornom dvore pod lipou", label: "Terasa" },
  privateRoom: { file: "private-room.jpg", alt: "Prestretý dlhý stôl v salóniku", label: "Salónik" },
  kitchen: { file: "kitchen.jpg", alt: "Otvorená kuchyňa s grilom na drevenom uhlí", label: "Otvorená kuchyňa" },
  chef: { file: "chef.jpg", alt: "Šéfkuchár Tomáš Hudák pri príprave jedla", label: "Šéfkuchár" },
  sommelier: { file: "sommelier.jpg", alt: "Sommeliérka Petra Kollárová", label: "Sommeliérka" },
  manager: { file: "manager.jpg", alt: "Prevádzková manažérka Lucia Mrázová", label: "Manažérka" },
  farm: { file: "farm.jpg", alt: "Zelenina od farmára v debničke", label: "Suroviny od farmárov" },
  dishTartare: { file: "dish-tartare.jpg", alt: "Tatarák z hovädzej sviečkovice so žĺtkom", label: "Tatarák" },
  dishBeetroot: { file: "dish-beetroot.jpg", alt: "Pečená cvikla s kozím syrom a orechmi", label: "Cvikla a kozí syr" },
  dishCheese: { file: "dish-cheese.jpg", alt: "Doska so slovenskými syrmi", label: "Syry" },
  dishHalusky: { file: "dish-halusky.jpg", alt: "Bryndzové halušky so slaninou", label: "Bryndzové halušky" },
  dishDuck: { file: "dish-duck.jpg", alt: "Kačacie stehno s červenou kapustou", label: "Kačacie stehno" },
  dishCheeks: { file: "dish-cheeks.jpg", alt: "Hovädzie líčka s pyré", label: "Hovädzie líčka" },
  dishFish: { file: "dish-fish.jpg", alt: "Filet zo zubáča so šošovicou", label: "Zubáč" },
  dishBurger: { file: "dish-burger.jpg", alt: "Burger s hranolkami", label: "Lipa burger" },
  dishSteak: { file: "dish-steak.jpg", alt: "Nakrájaný rib-eye steak", label: "Rib-eye steak" },
  dishDessert: { file: "dish-dessert.jpg", alt: "Makové šúľance s hruškou", label: "Dezert" },
  eventWine: { file: "event-wine.jpg", alt: "Degustácia vín pri dlhom stole", label: "Degustácia vín" },
  eventJazz: { file: "event-jazz.jpg", alt: "Jazzové trio hrá večer na dvore", label: "Jazz" },
  eventChef: { file: "event-chef.jpg", alt: "Šéfkuchár servíruje degustačné menu", label: "Chef's table" },
  eventBread: { file: "event-bread.jpg", alt: "Čerstvo upečený kváskový chlieb", label: "Kurz kváskového chleba" },
  eventGoose: { file: "event-goose.jpg", alt: "Pečená hus s lokšami", label: "Martinská hus" },
  eventNewYear: { file: "event-new-year.jpg", alt: "Prípitok so sektom", label: "Silvester" },
} as const;

export type PhotoKey = keyof typeof PHOTOS;

export const photoSrc = (key: PhotoKey) => `/images/${PHOTOS[key].file}`;
