import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });
    if (!ADMIN_SECRET) return NextResponse.json({ error: "not_configured" }, { status: 500 });

    const res = await fetch(`${API}/admin/bootstrap`, {
      method: "POST",
      headers: { "x-admin-secret": ADMIN_SECRET, "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
