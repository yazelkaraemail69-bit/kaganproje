import { INVITE_BONUS_CREDITS } from "@/lib/billing/plans";
import {
  addCredits,
  getAccountById,
  getAccountByInviteCode,
  updateAccount,
} from "@/lib/account-store";
import { computeFoundingReferralExpiry } from "@/lib/billing/founding";

/**
 * Yeni abone ilk ödemeyi yaptığında davet kredisi (+50/+50).
 * Self-referral engelli; her hesap için tek sefer.
 */
export async function applyInviteBonusOnFirstPayment(payerAccountId: string): Promise<{
  applied: boolean;
  inviterId?: string;
  bonus: number;
}> {
  const payer = await getAccountById(payerAccountId);
  if (!payer) return { applied: false, bonus: 0 };
  if (payer.inviteBonusGranted) return { applied: false, bonus: 0 };
  if (!payer.referredByCode) {
    await updateAccount(payer.id, { inviteBonusGranted: true });
    return { applied: false, bonus: 0 };
  }

  const inviter = await getAccountByInviteCode(payer.referredByCode);
  if (!inviter || inviter.id === payer.id) {
    await updateAccount(payer.id, { inviteBonusGranted: true });
    return { applied: false, bonus: 0 };
  }

  await addCredits(inviter.id, INVITE_BONUS_CREDITS);
  await addCredits(payer.id, INVITE_BONUS_CREDITS);
  await updateAccount(payer.id, { inviteBonusGranted: true });

  return { applied: true, inviterId: inviter.id, bonus: INVITE_BONUS_CREDITS };
}

/**
 * Arkadaş kayıt olduğunda: davet eden kurucu üyenin ücretsiz süresini
 * 7 → 10 güne uzatır (tek sefer). Kayıt anında tetiklenir; ödeme gerekmez.
 */
export async function applyFoundingReferralExtension(newAccountId: string): Promise<{
  extended: boolean;
  inviterId?: string;
  newExpiresAt?: string;
}> {
  const newbie = await getAccountById(newAccountId);
  if (!newbie?.referredByCode) return { extended: false };

  const inviter = await getAccountByInviteCode(newbie.referredByCode);
  if (!inviter || inviter.id === newbie.id) return { extended: false };
  if (!inviter.foundingMember) return { extended: false };
  if (inviter.foundingReferralExtended) return { extended: false };
  if (inviter.paymentMethod !== "founding") return { extended: false };

  const newExpiresAt = computeFoundingReferralExpiry(inviter);
  await updateAccount(inviter.id, {
    planExpiresAt: newExpiresAt,
    foundingReferralExtended: true,
    subscriptionStatus: "active",
  });

  return { extended: true, inviterId: inviter.id, newExpiresAt };
}
