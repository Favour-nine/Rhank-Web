"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bebas_Neue } from "next/font/google";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import AppNav from "@/components/AppNav";
import ThreeBg from "@/components/ThreeBg";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [emailStatus, setEmailStatus] = useState<"idle" | "saving" | "sent" | "error">("idle");
  const [passStatus, setPassStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [passError, setPassError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/account");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameStatus("saving");
    await supabase.auth.updateUser({ data: { name: name.trim() } });
    setNameStatus("saved");
    setTimeout(() => setNameStatus("idle"), 3000);
  };

  const saveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus("saving");
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setEmailStatus(error ? "error" : "sent");
    setTimeout(() => setEmailStatus("idle"), 6000);
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    if (newPassword.length < 8) { setPassError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPassError("Passwords do not match."); return; }
    setPassStatus("saving");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPassError(error.message); setPassStatus("idle"); return; }
    setPassStatus("saved");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPassStatus("idle"), 3000);
  };

  if (!user) return null;

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-2xl px-6 pt-16 pb-24 md:pt-24">
        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/50 mb-3">Your account</p>
        <h1 className={`${bebas.className} text-6xl md:text-8xl leading-none mb-10`}>Settings.</h1>

        <div className="space-y-6">
          {/* Display name */}
          <div className="border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-4">Display name</p>
            <form onSubmit={saveName} className="flex gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="flex-1 border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/60 transition-colors text-sm"
              />
              <button
                type="submit"
                disabled={nameStatus === "saving"}
                className="bg-[#ffe600] px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 disabled:opacity-50 transition-colors shrink-0"
              >
                {nameStatus === "saved" ? "Saved" : nameStatus === "saving" ? "Saving…" : "Save"}
              </button>
            </form>
          </div>

          {/* Email */}
          <div className="border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-1">Email address</p>
            {emailStatus === "sent" && (
              <p className="text-[11px] text-[#ffe600] mb-3">Confirmation sent to your new email. Click the link to confirm.</p>
            )}
            {emailStatus === "error" && (
              <p className="text-[11px] text-red-400 mb-3">Failed to update email. Try again.</p>
            )}
            <form onSubmit={saveEmail} className="flex gap-3 mt-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/60 transition-colors text-sm"
              />
              <button
                type="submit"
                disabled={emailStatus === "saving" || email === user.email}
                className="bg-[#ffe600] px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 disabled:opacity-50 transition-colors shrink-0"
              >
                {emailStatus === "saving" ? "Saving…" : "Update"}
              </button>
            </form>
          </div>

          {/* Password */}
          <div className="border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-4">Change password</p>
            <form onSubmit={savePassword} className="space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min. 8 characters)"
                className="w-full border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/60 transition-colors text-sm"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/60 transition-colors text-sm"
              />
              {passError && (
                <p className="text-sm text-[#ffe600] border border-[#ffe600]/30 bg-[#ffe600]/10 px-4 py-3">{passError}</p>
              )}
              <button
                type="submit"
                disabled={passStatus === "saving" || !newPassword}
                className="w-full bg-[#ffe600] px-5 py-3 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 disabled:opacity-50 transition-colors"
              >
                {passStatus === "saved" ? "Password updated" : passStatus === "saving" ? "Saving…" : "Update password"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
