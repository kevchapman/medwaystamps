import Stripe from "stripe";
import type { Env } from "./types";

export function getStripe(env: Env): Stripe {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    // Workers has no Node net/http APIs, so Stripe needs its fetch-based client.
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: "2025-02-24.acacia",
  });
}
