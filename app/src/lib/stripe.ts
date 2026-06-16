import {loadStripe, type Stripe} from "@stripe/stripe-js";

/** Memoised Stripe.js instance so the script loads at most once per session. */
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Lazily load Stripe.js once and reuse the same promise thereafter.
 *
 * The publishable key is injected at build time through vite's `define` (see
 * `vite.config.ts`); the secret key lives only on the backend and must never
 * reach the client bundle.
 *
 * @returns The `Stripe` instance, or `null` when no publishable key is set.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = import.meta.env.STRIPE_PUBLISHABLE_KEY;
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}
