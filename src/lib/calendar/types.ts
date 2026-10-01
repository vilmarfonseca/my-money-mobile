// Synced from my-money-v2 (src/lib/calendar/types.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
export type CalendarView = "year" | "month" | "week" | "due";

export type DueType =
  | "bill"
  | "subscription"
  | "credit"
  | "income"
  | "tax"
  | "loan";

/**
 * `overdue` never comes from the database (scheduled_items keeps its 4-value
 * enum) — it marks a virtual card bill that reached its due day unpaid.
 */
export type DueStatus = "scheduled" | "autopay" | "review" | "paid" | "overdue";

export type DueItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  type: DueType;
  amount: number;
  account: string;
  status: DueStatus;
  note: string;
  /** Set on virtual card-bill items: opens the pay-bill modal on click. */
  billCardId?: string;
};

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
