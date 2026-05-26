"use client";

import { useEffect, useState, useCallback } from "react";
import { Bebas_Neue } from "next/font/google";
import { supabase } from "@/lib/supabase";
import type { Team } from "@/lib/supabase";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

type TeamWithStats = Team & { total: number; member_count: number };

type Props = {
  slug: string;
  unit: string;
  isOwner: boolean;
};

export default function TeamLeaderboard({ slug, unit, isOwner }: Props) {
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [open, setOpen] = useState(false);

  // Owner: create team
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#ffffff");
  const [creating, setCreating] = useState(false);

  const fetchTeams = useCallback(async () => {
    const res = await fetch(`/api/rhanks/${slug}/teams`);
    const data = await res.json();
    setTeams((data.teams ?? []).sort((a: TeamWithStats, b: TeamWithStats) => b.total - a.total));
  }, [slug]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreating(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    await fetch(`/api/rhanks/${slug}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ name: newTeamName.trim(), color: newTeamColor }),
    });
    setNewTeamName("");
    setCreating(false);
    fetchTeams();
  };

  const deleteTeam = async (teamId: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    await fetch(`/api/rhanks/${slug}/teams/${teamId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    fetchTeams();
  };

  if (teams.length === 0 && !isOwner) return null;

  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase text-white/40 hover:text-white/70 transition-colors mb-3"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        Teams {teams.length > 0 && `(${teams.length})`}
      </button>

      {open && (
        <div className="space-y-3">
          {/* Team rankings */}
          {teams.length > 0 && (
            <div className="border border-white/10 divide-y divide-white/5">
              <div className="grid grid-cols-[2.5rem_1fr_auto] px-5 py-2.5 text-[10px] font-semibold tracking-[0.22em] uppercase text-white/25">
                <span>#</span><span>Team</span><span>{unit}</span>
              </div>
              {teams.map((team, i) => (
                <div key={team.id} className="grid grid-cols-[2.5rem_1fr_auto] items-center px-5 py-3">
                  <span className="text-sm font-bold text-white/30 tabular-nums">{i + 1}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: team.color }} />
                    <span className="text-sm text-white/80">{team.name}</span>
                    <span className="text-[10px] text-white/25">{team.member_count}m</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-base font-bold tabular-nums ${team.total >= 0 ? "text-white/60" : "text-red-400"}`}>
                      {team.total > 0 ? "+" : ""}{team.total}
                    </span>
                    {isOwner && (
                      <button onClick={() => deleteTeam(team.id)}
                        className="text-[10px] text-white/20 hover:text-red-400 transition-colors">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Owner: create team */}
          {isOwner && (
            <form onSubmit={createTeam} className="flex gap-2 items-center">
              <input
                value={newTeamColor}
                onChange={(e) => setNewTeamColor(e.target.value)}
                type="color"
                className="w-9 h-9 border border-white/20 bg-transparent cursor-pointer shrink-0"
                title="Team colour"
              />
              <input
                required
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="New team name…"
                className="flex-1 border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:border-white/50 text-sm transition-colors"
              />
              <button
                type="submit"
                disabled={creating}
                className="border border-white/25 px-4 py-2 text-[11px] font-bold tracking-[0.15em] uppercase text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                {creating ? "…" : "Add"}
              </button>
            </form>
          )}

          {teams.length === 0 && isOwner && (
            <p className="text-[11px] text-white/25">No teams yet. Create one above and assign members in the Creator panel.</p>
          )}
        </div>
      )}
    </div>
  );
}
