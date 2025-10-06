import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../../lib/jwt";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ authenticated: false }, { status: 200 });
  try {
    const payload = await verifySession(token);
    return NextResponse.json({ authenticated: true, user: payload }, { status: 200 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}


