import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export type Rhank = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  unit: string;
  direction: "high" | "low";
  creator_name: string;
  user_id: string | null;
  type: "score" | "token";
  join_mode: "open" | "request" | "invite";
  invite_token: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  reset_schedule: "weekly" | "monthly" | null;
  last_reset_at: string | null;
  moderation_enabled: boolean;
};

export type Member = {
  id: string;
  rhank_id: string;
  user_id: string | null;
  name: string;
  status: "pending" | "active" | "rejected";
  balance: number;
  team_id: string | null;
  created_at: string;
};

export type Team = {
  id: string;
  rhank_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type TokenTransaction = {
  id: string;
  rhank_id: string;
  member_id: string;
  amount: number;
  reason: string | null;
  created_by: string | null;
  created_at: string;
};

export type Entry = {
  id: string;
  rhank_id: string;
  participant_name: string;
  value: number;
  proof_url: string | null;
  user_id: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type Webhook = {
  id: string;
  rhank_id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  created_at: string;
};

export const WEBHOOK_EVENTS = ["entry.created", "member.approved", "member.joined"] as const;
export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

export const REACTION_EMOJIS = ["🔥", "👏", "💪", "🏆", "😱"] as const;
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

export type EntryReaction = {
  id: string;
  entry_id: string;
  user_id: string | null;
  emoji: ReactionEmoji;
  created_at: string;
};
