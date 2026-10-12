import type { InquiryStatus, ReservationStatus } from "./types";

export const RESERVATION_STATUS: Record<ReservationStatus, string> = {
  confirmed: "Potvrdená",
  seated: "Hostia sedia",
  completed: "Ukončená",
  noshow: "Neprišli",
  cancelled: "Zrušená",
};

export const INQUIRY_STATUS: Record<InquiryStatus, string> = {
  new: "Nový dopyt",
  offer: "Ponuka odoslaná",
  confirmed: "Potvrdené",
  declined: "Zamietnuté",
};
