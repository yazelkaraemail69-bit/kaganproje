import { NextResponse } from "next/server";
import { listAccounts, updateAccount } from "@/lib/account-store";
import { getStripe } from "@/lib/billing/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";

async function findAccountIdFromStripe(object: {
  metadata?: Stripe.Metadata | null;
  customer?: string | Stripe.Customer | Stripe.DeletedCustomer | null;
}): Promise<string | null> {
  const fromMeta = object.metadata?.accountId;
  if (fromMeta) return fromMeta;

  const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id;
  if (!customerId) return null;

  const accounts = await listAccounts();
  return accounts.find((a) => a.stripeCustomerId === customerId)?.id ?? null;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhook yapılandırılmadı." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "İmza eksik." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature error:", error);
    return NextResponse.json({ error: "Geçersiz imza." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const accountId = await findAccountIdFromStripe(session);
      if (accountId) {
        await updateAccount(accountId, {
          plan: "pro",
          subscriptionStatus: "active",
          stripeSubscriptionId:
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id,
        });
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const accountId = await findAccountIdFromStripe(subscription);
      if (accountId) {
        const active = subscription.status === "active" || subscription.status === "trialing";
        await updateAccount(accountId, {
          plan: active ? "pro" : "free",
          subscriptionStatus: active
            ? "active"
            : subscription.status === "past_due"
              ? "past_due"
              : "canceled",
          stripeSubscriptionId: subscription.id,
        });
      }
    }
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json({ error: "İşlenemedi." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
