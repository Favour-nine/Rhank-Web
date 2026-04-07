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
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
};

export type Entry = {
  id: string;
  rhank_id: string;
  participant_name: string;
  value: number;
  proof_url: string | null;
  created_at: string;
};
