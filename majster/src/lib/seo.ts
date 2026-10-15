import { WEEK_HOURS } from "../config";
import { minutesToTime } from "./format";
import { BIZ, TRADE } from "./profile";

const SCHEMA_TYPE: Record<string, string> = {
  elektrikar: "Electrician",
  instalater: "Plumber",
  maliar: "HousePainter",
  stolar: "HomeAndConstructionBusiness",
  obkladac: "HomeAndConstructionBusiness",
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** schema.org data for search engines, built from the active profile. */
export function applySchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[TRADE.id] ?? "HomeAndConstructionBusiness",
    name: BIZ.name,
    description: `${TRADE.tagline} – ${BIZ.city} a okolie`,
    telephone: BIZ.phone,
    email: BIZ.email,
    url: `https://${BIZ.web}`,
    priceRange: "€€",
    foundingDate: String(BIZ.since),
    address: { "@type": "PostalAddress", streetAddress: BIZ.street, addressLocality: BIZ.city, addressCountry: "SK" },
    areaServed: { "@type": "GeoCircle", geoMidpoint: { "@type": "Place", name: BIZ.city }, geoRadius: "50000" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: String(TRADE.stats.rating), reviewCount: String(TRADE.stats.reviews) },
    openingHoursSpecification: WEEK_HOURS.flatMap((h, i) => (h ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: DAYS[i], opens: minutesToTime(h.open), closes: minutesToTime(h.close) }] : [])),
    makesOffer: TRADE.services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.title } })),
  };
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}
