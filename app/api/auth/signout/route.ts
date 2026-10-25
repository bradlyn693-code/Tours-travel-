import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isAllowedOrigin } from "@/lib/origin-guard";
import { ACCESS_COOKIE, clearAuthCookies } from "@/lib/supabase-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Origin is not allowed." }, { status: 403 });
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value || "";
  if (accessToken) {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.auth.admin.signOut(accessToken, "local");
    } catch {
      // The browser session is still cleared below if the provider is unavailable.
    }
  }

  const response = NextResponse.json({ success: true });
  response.headers.set("Cache-Control", "no-store");
  clearAuthCookies(response);
  return response;
}
