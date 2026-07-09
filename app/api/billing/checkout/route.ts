import { NextResponse } from "next/server";
import { getAccountById, updateAccount } from "@/lib/account-store";
import { getSessionAccount } from "@/lib/auth/session";
import { getStripe, getStripePriceId, isStripeConfigured } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  const session = await getSessionAccount();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    // Dev / demo: Stripe yoksa Pro'yu doğrudan aç
    const account = await updateAccount(session.id, {
      plan: "pro",
      subscriptionStatus: "active",
    });
    return NextResponse.json({
      mode: "demo",
      message: "Stripe yapılandırılmadı — demo Pro planı etkinleştirildi.",
      account,
      url: null,
    });
  }

  const stripe = getStripe()!;
  const priceId = getStripePriceId()!;
  const account = await getAccountById(session.id);
  if (!account) {
    return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
  }

  let customerId = account.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: account.email,
      name: account.name,
      metadata: { accountId: account.id },
    });
    customerId = customer.id;
    await updateAccount(account.id, { stripeCustomerId: customerId });
  }

  const origin = new URL(request.url).origin;
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/hesap?billing=success`,
    cancel_url: `${origin}/hesap?billing=cancel`,
    metadata: { accountId: account.id },
    subscription_data: {
      metadata: { accountId: account.id },
    },
  });

  return NextResponse.json({ mode: "stripe", url: checkout.url });
}
