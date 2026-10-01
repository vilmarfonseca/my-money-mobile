// Synced from my-money-v2 (src/lib/support/support-options.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import {
  AlertTriangle,
  CircleHelp,
  Lightbulb,
  MoreHorizontal,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react-native";

export const supportReasons = [
  {
    label: "Report a problem",
    value: "issue",
    icon: AlertTriangle,
  },
  {
    label: "Get account or product help",
    value: "assistance",
    icon: CircleHelp,
  },
  {
    label: "Share an idea",
    value: "suggestion",
    icon: Lightbulb,
  },
  {
    label: "Raise a concern",
    value: "complaint",
    icon: ShieldAlert,
  },
  {
    label: "Something else",
    value: "other",
    icon: MoreHorizontal,
  },
] as const satisfies ReadonlyArray<{
  label: string;
  value: string;
  icon: LucideIcon;
}>;

export type SupportReason = (typeof supportReasons)[number]["value"];

export function getSupportReasonLabel(value: SupportReason) {
  return (
    supportReasons.find((reason) => reason.value === value)?.label ?? value
  );
}

export function isSupportReason(value: string): value is SupportReason {
  return supportReasons.some((reason) => reason.value === value);
}
