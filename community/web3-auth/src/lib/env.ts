export type Web3AuthEnv = {
  WEB3AUTH_CLIENT_ID: string;
  WEB3AUTH_NETWORK: "mainnet" | "testnet" | "cyan";
  SOLANA_RPC: string;
  SOLANA_CHAIN_ID: "solana" | "solana-testnet" | "solana-devnet";
};

function readEnvVar(name: keyof Web3AuthEnv): string {
  const value = process.env[name as string];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function loadWeb3AuthEnv(): Web3AuthEnv {
  return {
    WEB3AUTH_CLIENT_ID: readEnvVar("WEB3AUTH_CLIENT_ID"),
    WEB3AUTH_NETWORK: (readEnvVar("WEB3AUTH_NETWORK") as Web3AuthEnv["WEB3AUTH_NETWORK"]) || "testnet",
    SOLANA_RPC: readEnvVar("SOLANA_RPC"),
    SOLANA_CHAIN_ID: (readEnvVar("SOLANA_CHAIN_ID") as Web3AuthEnv["SOLANA_CHAIN_ID"]) || "solana-devnet",
  };
}

export const isServer = typeof window === "undefined";


