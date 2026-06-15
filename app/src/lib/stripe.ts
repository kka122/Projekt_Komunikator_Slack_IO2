import {loadStripe, type Stripe} from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

// Lazily load Stripe.js once. The publishable key is injected at build time
// through vite's `define` (see vite.config.ts). The secret key lives only on
// the backend and must never reach the client bundle.
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = import.meta.env.STRIPE_PUBLISHABLE_KEY;
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}
