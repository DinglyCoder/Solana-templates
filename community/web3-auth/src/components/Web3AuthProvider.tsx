"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Web3Auth } from "@web3auth/modal";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import type { SafeEventEmitterProvider } from "@web3auth/base";

type AuthUser = {
  address: string | null;
  provider: string | null; // google, twitter, discord, github, email, sms
  profile?: Record<string, unknown>;
};

type AuthContextValue = {
  user: AuthUser | null;
  provider: SafeEventEmitterProvider | null;
  loading: boolean;
  loginWithProvider: (provider: "google" | "twitter" | "discord" | "github") => Promise<void>;
  loginWithEmailOtp: (email: string) => Promise<void>;
  loginWithSmsOtp: (phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  getAddress: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useWeb3Auth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useWeb3Auth must be used within Web3AuthProvider");
  return ctx;
}

function getClientEnv(name: string, fallback?: string): string {
  const value = (process.env as any)[name];
  if (value) return value as string;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing env ${name}`);
}

const NEXT_PUBLIC_WEB3AUTH_CLIENT_ID = getClientEnv("NEXT_PUBLIC_WEB3AUTH_CLIENT_ID", "");
const NEXT_PUBLIC_WEB3AUTH_NETWORK = getClientEnv("NEXT_PUBLIC_WEB3AUTH_NETWORK", "testnet");
const NEXT_PUBLIC_SOLANA_RPC = getClientEnv("NEXT_PUBLIC_SOLANA_RPC", "https://api.devnet.solana.com");
const NEXT_PUBLIC_SOLANA_CHAIN_ID = getClientEnv("NEXT_PUBLIC_SOLANA_CHAIN_ID", "solana-devnet");

export default function Web3AuthProvider({ children }: { children: React.ReactNode }) {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // Hydrate from server session first
        try {
          const res = await fetch("/api/session/validate", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (data?.authenticated && data?.user) {
              setUser({ address: data.user.address ?? null, provider: data.user.provider ?? null });
            }
          }
        } catch {}

        const privateKeyProvider = new SolanaPrivateKeyProvider({
          config: {
            chainConfig: {
              chainNamespace: "solana",
              chainId: NEXT_PUBLIC_SOLANA_CHAIN_ID,
              rpcTarget: NEXT_PUBLIC_SOLANA_RPC,
              displayName: "Solana",
              ticker: "SOL",
              tickerName: "Solana",
            },
          },
        });

        const instance = new Web3Auth({
          clientId: NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
          web3AuthNetwork: NEXT_PUBLIC_WEB3AUTH_NETWORK as any,
          privateKeyProvider,
          uiConfig: {
            appName: "Web3Auth Solana Template",
            mode: "light",
            loginMethodsOrder: ["google", "twitter", "discord", "github", "email_passwordless", "sms_passwordless"],
            defaultLanguage: "en",
          },
        });

        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            uxMode: "redirect",
            loginConfig: {
              google: { verifier: "web3auth-google" },
              twitter: { verifier: "web3auth-twitter" },
              discord: { verifier: "web3auth-discord" },
              github: { verifier: "web3auth-github" },
              email_passwordless: { verifier: "web3auth-email" },
              sms_passwordless: { verifier: "web3auth-sms" },
            },
          },
          loginSettings: {
            mfaLevel: "optional",
          },
        });
        instance.configureAdapter(openloginAdapter);

        await instance.initModal();
        setWeb3auth(instance);
        setProvider(instance.provider as any);

        if (instance.status === "connected") {
          const address = await getAddressFromProvider(instance.provider as any);
          setUser((prev) => prev ?? { address, provider: "session" });
        }
      } catch (e) {
        // No-op: surface via UI later
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginWithProvider = useCallback(async (p: "google" | "twitter" | "discord" | "github") => {
    if (!web3auth) throw new Error("Web3Auth not ready");
    const prov = await web3auth.connectTo("openlogin", { loginProvider: p });
    setProvider(prov as any);
    const address = await getAddressFromProvider(prov as any);
    setUser({ address, provider: p });
    await fetch("/api/session/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address, provider: p }) });
  }, [web3auth]);

  const loginWithEmailOtp = useCallback(async (email: string) => {
    if (!web3auth) throw new Error("Web3Auth not ready");
    const prov = await web3auth.connectTo("openlogin", {
      loginProvider: "email_passwordless",
      extraLoginOptions: { login_hint: email },
    } as any);
    setProvider(prov as any);
    const address = await getAddressFromProvider(prov as any);
    setUser({ address, provider: "email" });
    await fetch("/api/session/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address, provider: "email" }) });
  }, [web3auth]);

  const loginWithSmsOtp = useCallback(async (phoneNumber: string) => {
    if (!web3auth) throw new Error("Web3Auth not ready");
    const prov = await web3auth.connectTo("openlogin", {
      loginProvider: "sms_passwordless",
      extraLoginOptions: { login_hint: phoneNumber },
    } as any);
    setProvider(prov as any);
    const address = await getAddressFromProvider(prov as any);
    setUser({ address, provider: "sms" });
    await fetch("/api/session/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address, provider: "sms" }) });
  }, [web3auth]);

  const logout = useCallback(async () => {
    await web3auth?.logout();
    setProvider(null);
    setUser(null);
    await fetch("/api/session/logout", { method: "POST" });
  }, [web3auth]);

  const getAddress = useCallback(async () => {
    if (!provider) return null;
    return await getAddressFromProvider(provider);
  }, [provider]);

  const signMessage = useCallback(async (message: string) => {
    if (!provider) throw new Error("No provider");
    const solana = new (await import("@web3auth/solana-provider")).SolanaWallet(provider);
    const msg = new TextEncoder().encode(message);
    const res = await solana.signMessage(msg, "utf8");
    return Buffer.from(res.signature).toString("base64");
  }, [provider]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    provider,
    loading,
    loginWithProvider,
    loginWithEmailOtp,
    loginWithSmsOtp,
    logout,
    signMessage,
    getAddress,
  }), [user, provider, loading, loginWithProvider, loginWithEmailOtp, loginWithSmsOtp, logout, signMessage, getAddress]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function getAddressFromProvider(provider: SafeEventEmitterProvider | null): Promise<string | null> {
  if (!provider) return null;
  const solana = new (await import("@web3auth/solana-provider")).SolanaWallet(provider);
  const accounts = await solana.requestAccounts();
  return accounts?.[0] ?? null;
}


