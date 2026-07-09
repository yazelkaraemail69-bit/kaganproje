import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function getStripePriceId(): string | null {
  return process.env.STRIPE_PRICE_ID?.trim() || null;
}

export function isStripeConfigured(): boolean {
  return Boolean(getStripe() && getStripePriceId());
}
