export type PhotoDef = { file: string; alt: string; label: string; /** CSS object-position when the subject is off-centre. */ focus?: string };

/**
 * Every photo slot on the site, served from public/images/. A missing file shows a styled placeholder with the
 * slot's label instead. PHOTOS.md lists the source of each photo.
 */
export const PHOTOS = {
  hero: { file: "hero.jpg", alt: "Večerná jedáleň s drevenými stoličkami a teplým svetlom", label: "Hero · jedáleň večer" },
  interior: { file: "interior.jpg", alt: "Zelené čalúnené lavice a stoly medzi rastlinami", label: "Interiér" },
  bar: { file: "bar.jpg", alt: "Stena regálov plných fliaš vína", label: "Vínny bar" },
  terrace: { file: "terrace.jpg", alt: "Presklený dvor plný rastlín so stolmi a barom", label: "Terasa" },
  privateRoom: { file: "private-room.jpg", alt: "Dlhý prestretý stôl s pohármi v salóniku", label: "Salónik" },
  kitchen: { file: "kitchen.jpg", alt: "Kuchár pri sporáku, z panvice šľahajú plamene", label: "Otvorená kuchyňa", focus: "62% 50%" },
  chef: { file: "chef.jpg", alt: "Kuchár pinzetou dokončuje tanier pod medenými lampami", label: "Šéfkuchár" },
  sommelier: { file: "sommelier.jpg", alt: "Nalievanie červeného vína do pohára", label: "Sommeliérka" },
  manager: { file: "manager.jpg", alt: "Usmievavá manažérka pri pokladni", label: "Manažérka", focus: "82% 40%" },
  farm: { file: "farm.jpg", alt: "Figy, vlašské orechy, paradajky a uhorky v miskách", label: "Suroviny od farmárov" },
  dishTartare: { file: "dish-tartare.jpg", alt: "Surová hovädzia sviečkovica s vločkovou soľou a korením", label: "Tatarák" },
  dishCheese: { file: "dish-cheese.jpg", alt: "Plesňový syr s figami a vlašskými orechmi", label: "Syry" },
  dishDuck: { file: "dish-duck.jpg", alt: "Pečená hydina v liatinovej panvici", label: "Pečená kačica" },
  dishCheeks: { file: "dish-cheeks.jpg", alt: "Hovädzie mäso s tmavou omáčkou a brokolicou", label: "Hovädzie líčka" },
  dishFish: { file: "dish-fish.jpg", alt: "Filet z ryby na špenáte so zeleninovou salsou", label: "Zubáč" },
  dishBurger: { file: "dish-burger.jpg", alt: "Burger s dvoma plátkami mäsa a cheddarom", label: "Lipa burger" },
  dishSteak: { file: "dish-steak.jpg", alt: "Nakrájaný steak na liatinovej panvici so špargľou", label: "Rib-eye steak" },
  dishFlank: { file: "dish-flank.jpg", alt: "Nakrájaný grilovaný flank steak na doske", label: "Flank steak" },
  dishPork: { file: "dish-pork.jpg", alt: "Grilované bravčové mäso s pečenými jablkami", label: "Bravčová panenka" },
  dishRisotto: { file: "dish-risotto.jpg", alt: "Krémové rizoto s hubami v bielom tanieri", label: "Rizoto" },
  dishDessert: { file: "dish-dessert.jpg", alt: "Čokoládový dezert so zmrzlinou a omáčkou", label: "Čokoládový fondant" },
  eventWine: { file: "event-wine.jpg", alt: "Hostia si pripíjajú bielym a červeným vínom", label: "Degustácia vín" },
  eventJazz: { file: "event-jazz.jpg", alt: "Saxofonista hrá vo farebnom svetle", label: "Jazz" },
  eventChef: { file: "event-chef.jpg", alt: "Šéfkuchár dokončuje chod degustačného menu", label: "Chef's table" },
  eventValentine: { file: "event-valentine.jpg", alt: "Slávnostne prestretý stôl pri sviečkach", label: "Valentínska večera" },
  eventBread: { file: "event-bread.jpg", alt: "Čerstvo upečený kváskový chlieb", label: "Kurz kváskového chleba" },
  eventGoose: { file: "event-goose.jpg", alt: "Celá pečená hus na tanieri", label: "Martinská hus" },
  eventNewYear: { file: "event-new-year.jpg", alt: "Prskavky v rukách za súmraku", label: "Silvester" },
} satisfies Record<string, PhotoDef>;

export type PhotoKey = keyof typeof PHOTOS;

export const photoSrc = (key: PhotoKey) => `/images/${PHOTOS[key].file}`;
