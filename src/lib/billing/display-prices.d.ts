// Synced from my-money-v2 (src/lib/billing/display-prices.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type BillingCurrency, type PlanTier } from "@/lib/billing/plans";
/**
 * Display prices for each tier, already formatted in the price's own Stripe
 * currency (e.g. "R$ 12,90", "$8.00").
 * - `month`: monthly price.
 * - `year`: per-month equivalent of the annual price (annual ÷ 12), shown as
 *   the headline number on the yearly toggle.
 * - `yearTotal`: the full amount charged once per year.
 * null when a price is missing. The free Starter tier is always null on all
 * three: the pricing UI renders it as "Free" without consulting Stripe.
 */
export type DisplayPrices = Record<PlanTier, {
    month: string | null;
    year: string | null;
    yearTotal: string | null;
}>;
export declare function getDisplayPrices(locale: string, currency?: BillingCurrency): Promise<DisplayPrices>;
/** Numeric monthly price per tier, for structured data (schema.org offers). */
export type OfferPrice = {
    tier: PlanTier;
    amount: number;
    currency: string;
};
/**
 * Monthly prices as numbers, for the homepage's SoftwareApplication JSON-LD.
 * Same source and fallback rule as `getDisplayPrices`.
 */
export declare function getOfferPrices(currency?: BillingCurrency): Promise<OfferPrice[]>;
