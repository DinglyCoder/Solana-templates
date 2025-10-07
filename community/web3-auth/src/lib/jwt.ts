import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

export type SessionPayload = {
  address: string;
  provider: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return encoder.encode(secret);
}

export async function signSession(payload: SessionPayload, maxAgeSeconds?: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (maxAgeSeconds ?? Number(process.env.SESSION_MAX_AGE_SECONDS ?? 60 * 60 * 24 * 7));
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(getSecret());
}

export async function verifySession<T extends object = SessionPayload>(token: string): Promise<T> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as T;
}



