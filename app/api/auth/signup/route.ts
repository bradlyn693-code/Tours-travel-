import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isAllowedOrigin } from "@/lib/origin-guard";
import { PASSWORD_PATTERN, readJsonBody } from "@/lib/supabase-auth";

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
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";

  if (!EMAIL_PATTERN.test(email) || email.length > 254 || !fullName || fullName.length > 120 || !phone || phone.length > 40) {
    return NextResponse.json({ error: "Enter a valid name, email, and phone number." }, { status: 400 });
  }
  if (!PASSWORD_PATTERN.test(password)) {
    return NextResponse.json({ error: "Password must be exactly 8 characters with at least one uppercase and one lowercase letter." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone }
    });

    if (error || !data.user) {
      return NextResponse.json({ error: "Could not create the account. Check the details and try again." }, { status: 400 });
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email: data.user.email || email,
      full_name: fullName,
      phone
    });

    if (profileError) {
      try {
        await supabase.auth.admin.deleteUser(data.user.id);
      } catch {
        // Keep provider details and personal data out of the response and logs.
      }
      return NextResponse.json({ error: "The profiles table is not ready; the account was not created." }, { status: 503 });
    }

    return NextResponse.json({ success: true, user: { id: data.user.id, email: data.user.email || email } });
  } catch {
    return NextResponse.json({ error: "Authentication service is unavailable. Configure the dedicated test Supabase project." }, { status: 503 });
  }
}
