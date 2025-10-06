import { NextRequest, NextResponse } from "next/server";
import { signSession } from "../../../../lib/jwt";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const address = body?.address as string | undefined;
  const provider = body?.provider as string | undefined;
  if (!address || !provider) {
    return NextResponse.json({ error: "address and provider required" }, { status: 400 });
  }
  const token = await signSession({ address, provider });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, { httpOnly: true, path: "/", sameSite: "lax", secure: true });
  return res;
}


