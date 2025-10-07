import { NextRequest, NextResponse } from "next/server";
import { signSession, verifySession } from "../../../../lib/jwt";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "no session" }, { status: 401 });
  try {
    const payload = await verifySession(token);
    const next = await signSession(payload);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", next, { httpOnly: true, path: "/", sameSite: "lax", secure: true });
    return res;
  } catch {
    return NextResponse.json({ error: "invalid session" }, { status: 401 });
  }
}



