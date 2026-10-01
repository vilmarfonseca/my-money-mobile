// Synced from my-money-v2 (src/lib/calendar/calendar-style.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { CalendarView, DueType } from "./types";

export const typeLabels: Record<DueType, string> = {
  bill: "Bills",
  subscription: "Subscriptions",
  credit: "Cards",
  income: "Income",
  tax: "Tax",
  loan: "Loans",
};

export const typeStyles: Record<
  DueType,
  { chip: string; dot: string; soft: string }
> = {
  bill: {
    chip: "border-warning/30 bg-warning/10 text-warning",
    dot: "bg-warning",
    soft: "bg-warning/10 text-warning",
  },
  subscription: {
    chip: "border-warm/30 bg-warm-soft text-warm-soft-fg",
    dot: "bg-warm",
    soft: "bg-warm-soft text-warm-soft-fg",
  },
  credit: {
    chip: "border-ds-accent/30 bg-accent-soft text-accent-soft-fg",
    dot: "bg-ds-accent",
    soft: "bg-accent-soft text-accent-soft-fg",
  },
  income: {
    chip: "border-positive/30 bg-positive-soft text-positive-fg",
    dot: "bg-positive",
    soft: "bg-positive-soft text-positive-fg",
  },
  tax: {
    chip: "border-negative/30 bg-negative-soft text-negative-fg",
    dot: "bg-negative",
    soft: "bg-negative-soft text-negative-fg",
  },
  loan: {
    chip: "border-ink-3/20 bg-surface-2 text-ink-2",
    dot: "bg-ink-3",
    soft: "bg-surface-2 text-ink-2",
  },
};

export const viewOptions: Array<{ value: CalendarView; label: string }> = [
  { value: "due", label: "Next due" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];
