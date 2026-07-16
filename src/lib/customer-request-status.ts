import { CustomerRequestStatus } from "@/lib/types";

export const CUSTOMER_REQUEST_STATUS_LABEL: Record<CustomerRequestStatus, string> = {
  submitted: "Übermittelt",
  acknowledged: "Wahrgenommen",
  rejected: "Abgelehnt",
  revision: "Revision",
  in_progress: "In Bearbeitung",
  completed: "Umgesetzt",
};

export const CUSTOMER_REQUEST_STATUS_CHIP: Record<CustomerRequestStatus, string> = {
  submitted: "chip-warning",
  acknowledged: "chip-primary",
  rejected: "chip-error",
  revision: "chip-error",
  in_progress: "chip-primary",
  completed: "chip-success",
};

export const OPEN_CUSTOMER_REQUEST_STATUSES = new Set<CustomerRequestStatus>([
  "submitted",
  "acknowledged",
  "revision",
  "in_progress",
]);

export const CUSTOMER_REQUEST_CATEGORIES = [
  "Allgemein",
  "Änderungswunsch",
  "Fehler / Bug",
  "Neue Funktion",
  "Dokumentation",
  "Sonstiges",
] as const;

export const CUSTOMER_REQUEST_AREAS = [
  "Portal",
  "Website",
  "Automatisierung",
  "E-Mail",
  "Integration",
  "Sonstiges",
] as const;

export const ADMIN_STATUS_TRANSITIONS: Record<CustomerRequestStatus, CustomerRequestStatus[]> = {
  submitted: ["acknowledged", "rejected", "revision", "in_progress"],
  acknowledged: ["in_progress", "revision", "rejected", "completed"],
  rejected: [],
  revision: ["acknowledged", "rejected"],
  in_progress: ["revision", "completed", "rejected"],
  completed: [],
};
