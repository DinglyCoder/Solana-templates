"use client";

import { useEffect, useState } from "react";
import { useWeb3Auth } from "../../components/Web3AuthProvider";
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function ProfilePage() {
  const { user, getAddress, signMessage, logout } = useWeb3Auth();
  const [addr, setAddr] = useState<string | null>(null);
  const [message, setMessage] = useState("Hello from Web3Auth");
  const [signature, setSignature] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);

  useEffect(() => {
    getAddress().then(setAddr).catch(() => setAddr(null));
  }, [getAddress]);

  async function doSign() {
    const sig = await signMessage(message);
    setSignature(sig);
  }

  async function doAirdropAndSend() {
    if (!addr) return;
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC!, "confirmed");

    // Airdrop on devnet to ensure balance for example
    try { await connection.requestAirdrop(new PublicKey(addr), 0.1 * LAMPORTS_PER_SOL); } catch {}

    const blockhash = await connection.getLatestBlockhash();
    const tx = new Transaction({ recentBlockhash: blockhash.blockhash, feePayer: new PublicKey(addr) });
    // Self transfer 0.001 SOL as example
    tx.add(SystemProgram.transfer({ fromPubkey: new PublicKey(addr), toPubkey: new PublicKey(addr), lamports: 0.001 * LAMPORTS_PER_SOL }));

    // Sign & send via provider
    const { SolanaWallet } = await import("@web3auth/solana-provider");
    const solana = new SolanaWallet((window as any).web3auth?.provider ?? null);
    // Fallback to request if not available
    try {
      const serialized = tx.serialize({ requireAllSignatures: false });
      const signed = await (solana as any).signAndSendTransaction(serialized.toString("base64"));
      setTxSig(signed);
    } catch (e) {
      setTxSig("Failed to send: " + (e as Error).message);
    }
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <div className="text-sm">Auth method: {user?.provider}</div>
      <div className="text-sm">Wallet address: {addr}</div>

      <div className="flex items-center gap-2">
        <input className="border px-2 py-2 rounded w-96" value={message} onChange={(e) => setMessage(e.target.value)} />
        <button className="px-3 py-2 rounded bg-black text-white" onClick={doSign}>Sign message</button>
      </div>
      {signature && <div className="text-xs break-all">Signature (base64): {signature}</div>}

      <button className="px-3 py-2 rounded bg-black text-white w-fit" onClick={doAirdropAndSend}>Send Example Tx</button>
      {txSig && <div className="text-xs break-all">Tx: {txSig}</div>}

      <button className="px-3 py-2 rounded border w-fit" onClick={() => logout()}>Logout</button>
    </div>
  );
}


