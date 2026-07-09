import { INVITE_BONUS_CREDITS } from "@/lib/billing/plans";
import {
  addCredits,
  getAccountById,
  getAccountByInviteCode,
  updateAccount,
} from "@/lib/account-store";

/**
 * Yeni abone ilk ödemeyi yaptığında davet bonusu uygular.
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
