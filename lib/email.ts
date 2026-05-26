import { Resend } from "resend";
import { getUserEmail } from "./supabase-admin";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL ?? "Rhank <noreply@rhank.app>";

async function send(to: string, subject: string, html: string) {
  if (!resend) return;
  await resend.emails.send({ from: FROM, to, subject, html });
}

export async function notifyOwnerOfJoinRequest(
  ownerUserId: string,
  rhankTitle: string,
  rhankSlug: string,
  memberName: string,
  baseUrl: string
) {
  try {
    const email = await getUserEmail(ownerUserId);
    if (!email) return;
    await send(
      email,
      `New join request for "${rhankTitle}"`,
      `<p><strong>${memberName}</strong> has requested to join your leaderboard <strong>${rhankTitle}</strong>.</p>
       <p><a href="${baseUrl}/r/${rhankSlug}">Review the request</a></p>`
    );
  } catch {}
}

export async function notifyMemberOfDecision(
  memberUserId: string,
  rhankTitle: string,
  rhankSlug: string,
  approved: boolean,
  baseUrl: string
) {
  try {
    const email = await getUserEmail(memberUserId);
    if (!email) return;
    if (approved) {
      await send(
        email,
        `You're on "${rhankTitle}"!`,
        `<p>Your request to join <strong>${rhankTitle}</strong> has been approved.</p>
         <p><a href="${baseUrl}/r/${rhankSlug}">View the leaderboard</a></p>`
      );
    } else {
      await send(
        email,
        `Update on your "${rhankTitle}" request`,
        `<p>Your request to join <strong>${rhankTitle}</strong> was not approved.</p>`
      );
    }
  } catch {}
}

export async function notifyMemberOfTokenAward(
  memberUserId: string,
  rhankTitle: string,
  rhankSlug: string,
  amount: number,
  unit: string,
  reason: string | null,
  newBalance: number,
  baseUrl: string
) {
  try {
    const email = await getUserEmail(memberUserId);
    if (!email) return;
    const label = amount > 0 ? `+${amount}` : `${amount}`;
    await send(
      email,
      `${label} ${unit} in "${rhankTitle}"`,
      `<p>You received <strong>${label} ${unit}</strong> in <strong>${rhankTitle}</strong>.</p>
       ${reason ? `<p>Reason: ${reason}</p>` : ""}
       <p>Your new balance: <strong>${newBalance} ${unit}</strong></p>
       <p><a href="${baseUrl}/r/${rhankSlug}">View leaderboard</a></p>`
    );
  } catch {}
}
