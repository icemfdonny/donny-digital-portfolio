import { TRADE } from "../../lib/profile";
import { useDB } from "../../lib/store";

export const NAV = [
  { to: "/sluzby", label: "Služby a cenník" },
  { to: "/realizacie", label: "Realizácie" },
  { to: "/kalkulacka", label: "Kalkulačka" },
  { to: "/kontakt", label: "Kontakt" },
];

/** The trade offers an emergency service and the owner has it switched on. */
export function useEmergencyOn() {
  const db = useDB();
  return !!TRADE.emergency && db.settings.emergencyOn;
}
