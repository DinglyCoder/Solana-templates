"use client";

import { useState } from "react";
import { useWeb3Auth } from "./Web3AuthProvider";

export default function AuthButtons() {
  const { loginWithProvider, loginWithEmailOtp, loginWithSmsOtp, logout, user, loading } = useWeb3Auth();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <div>Loading authentication...</div>;

  if (user) {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-sm">Logged in. Address: {user.address}</div>
        <button className="px-3 py-2 rounded bg-black text-white" onClick={() => logout()}>Logout</button>
      </div>
    );
  }

  async function doEmail() {
    setBusy(true);
    try { await loginWithEmailOtp(email); } finally { setBusy(false); }
  }

  async function doSms() {
    setBusy(true);
    try { await loginWithSmsOtp(phone); } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <button className="px-3 py-2 rounded border" onClick={() => loginWithProvider("google")}>Google</button>
        <button className="px-3 py-2 rounded border" onClick={() => loginWithProvider("twitter")}>Twitter</button>
        <button className="px-3 py-2 rounded border" onClick={() => loginWithProvider("discord")}>Discord</button>
        <button className="px-3 py-2 rounded border" onClick={() => loginWithProvider("github")}>GitHub</button>
      </div>

      <div className="flex items-center gap-2">
        <input className="border px-2 py-2 rounded w-60" placeholder="Email"
               value={email} onChange={(e) => setEmail(e.target.value)} />
        <button disabled={busy} className="px-3 py-2 rounded bg-black text-white" onClick={doEmail}>Login via Email</button>
      </div>

      <div className="flex items-center gap-2">
        <input className="border px-2 py-2 rounded w-60" placeholder="Phone e.g. +11234567890"
               value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button disabled={busy} className="px-3 py-2 rounded bg-black text-white" onClick={doSms}>Login via SMS</button>
      </div>
    </div>
  );
}


