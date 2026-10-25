import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, publicUser, setAuthCookies } from "@/lib/supabase-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!request.cookies.get("sb_access_token")?.value && !request.cookies.get("sb_refresh_token")?.value) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const { user, session } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const response = NextResponse.json({ user: publicUser(user) }, { headers: { "Cache-Control": "no-store" } });
    if (session) setAuthCookies(response, session);
    return response;
  } catch {
    return NextResponse.json({ error: "Authentication service is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
