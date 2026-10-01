// Synced from my-money-v2 (src/lib/categories/category-appearance.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { CSSProperties } from "react";
import {
  BadgeDollarSign,
  Banknote,
  Bike,
  BookOpen,
  Briefcase,
  BriefcaseBusiness,
  Bus,
  Car,
  CarFront,
  CircleDollarSign,
  Clapperboard,
  Coffee,
  Coins,
  CreditCard,
  Dog,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  Heart,
  HeartPulse,
  Home,
  Hotel,
  House,
  Landmark,
  Laptop,
  Lightbulb,
  Music,
  PawPrint,
  PiggyBank,
  Pill,
  Pizza,
  Plane,
  Receipt,
  ReceiptText,
  School,
  Scissors,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Stethoscope,
  Store,
  Ticket,
  TrainFront,
  TreePalm,
  Utensils,
  Wallet,
  WalletCards,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

/**
 * Curated set of lucide icons offered in the category icon picker. Keys are
 * the stored `categories.icon` values; keep them kebab-case so emoji values
 * (anything else) are distinguishable.
 */
export const categoryIconSet: Record<string, LucideIcon> = {
  "badge-dollar-sign": BadgeDollarSign,
  banknote: Banknote,
  bike: Bike,
  "book-open": BookOpen,
  briefcase: Briefcase,
  "briefcase-business": BriefcaseBusiness,
  bus: Bus,
  car: Car,
  "car-front": CarFront,
  "circle-dollar-sign": CircleDollarSign,
  clapperboard: Clapperboard,
  coffee: Coffee,
  coins: Coins,
  "credit-card": CreditCard,
  dog: Dog,
  dumbbell: Dumbbell,
  film: Film,
  fuel: Fuel,
  gamepad: Gamepad2,
  gift: Gift,
  "graduation-cap": GraduationCap,
  "hand-coins": HandCoins,
  heart: Heart,
  "heart-pulse": HeartPulse,
  home: Home,
  hotel: Hotel,
  house: House,
  landmark: Landmark,
  laptop: Laptop,
  lightbulb: Lightbulb,
  music: Music,
  "paw-print": PawPrint,
  "piggy-bank": PiggyBank,
  pill: Pill,
  pizza: Pizza,
  plane: Plane,
  receipt: Receipt,
  "receipt-text": ReceiptText,
  school: School,
  scissors: Scissors,
  shirt: Shirt,
  "shopping-bag": ShoppingBag,
  "shopping-cart": ShoppingCart,
  smartphone: Smartphone,
  sparkles: Sparkles,
  stethoscope: Stethoscope,
  store: Store,
  ticket: Ticket,
  train: TrainFront,
  "tree-palm": TreePalm,
  utensils: Utensils,
  wallet: Wallet,
  "wallet-cards": WalletCards,
  wifi: Wifi,
  wrench: Wrench,
  zap: Zap,
};

export const categoryIconNames = Object.keys(categoryIconSet);

/** Quick emoji choices shown in the picker; any emoji can also be typed. */
export const categoryEmojiSuggestions = [
  "🛒",
  "🍕",
  "🍔",
  "☕",
  "🍺",
  "🚗",
  "⛽",
  "🚌",
  "✈️",
  "🏠",
  "💡",
  "📱",
  "💻",
  "🎬",
  "🎮",
  "🎵",
  "👕",
  "💊",
  "🏥",
  "🏋️",
  "🎓",
  "👶",
  "🐶",
  "🎁",
  "💼",
  "💰",
  "💳",
  "🏦",
  "📈",
  "🧾",
  "✂️",
  "🌴",
];

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: string | null | undefined): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

/** Stored icon values are either a curated lucide name or a literal emoji. */
export function isLucideIconName(value: string | null | undefined) {
  return typeof value === "string" && value in categoryIconSet;
}

export function getCategoryIcon(
  value: string | null | undefined,
): LucideIcon | null {
  return value ? (categoryIconSet[value] ?? null) : null;
}

function hexChannels(hex: string): [number, number, number] {
  const value =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  return [
    parseInt(value.slice(1, 3), 16),
    parseInt(value.slice(3, 5), 16),
    parseInt(value.slice(5, 7), 16),
  ];
}

/** White or near-black foreground, whichever reads better on the color. */
export function readableTextColor(hex: string) {
  const [r, g, b] = hexChannels(hex);
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 160 ? "#1c1917" : "#ffffff";
}

/** Solid icon-badge style: category color as background, readable icon. */
export function categoryIconStyle(
  color: string | null | undefined,
): CSSProperties | undefined {
  if (!isHexColor(color)) return undefined;
  return {
    backgroundColor: color,
    borderColor: color,
    color: readableTextColor(color),
  };
}

/** Soft pill style: tinted background with the category color as text. */
export function categoryPillStyle(
  color: string | null | undefined,
): CSSProperties | undefined {
  if (!isHexColor(color)) return undefined;
  const [r, g, b] = hexChannels(color);
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.14)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.35)`,
    color,
  };
}
