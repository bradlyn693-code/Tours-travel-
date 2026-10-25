import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isAllowedOrigin } from "@/lib/origin-guard";
import { publicUser, readJsonBody, setAuthCookies } from "@/lib/supabase-auth";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Origin is not allowed." }, { status: 403 });
  }

  const parsed = await readJsonBody(request);
  if (parsed.status !== 200) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const input = parsed.value as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 254 || !password) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user || !data.session) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, user: publicUser(data.user) });
    response.headers.set("Cache-Control", "no-store");
    setAuthCookies(response, data.session);
    return response;
  } catch {
    return NextResponse.json({ error: "Authentication service is unavailable. Configure the dedicated test Supabase project." }, { status: 503 });
  }
}
