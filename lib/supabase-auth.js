import { getSupabaseAdmin } from "./supabase-admin.js";

export const ACCESS_COOKIE = "sb_access_token";
export const REFRESH_COOKIE = "sb_refresh_token";
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z]).{8}$/;

const cookieBase = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/"
};

export async function readJsonBody(request, maxBytes = 16_384) {
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    return { error: "Request is too large.", status: 413 };
  }

  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { error: "Invalid request body.", status: 400 };
    }
    return { value, status: 200 };
  } catch {
    return { error: "Invalid JSON body.", status: 400 };
  }
}

export function setAuthCookies(response, session) {
  const accessAge = Math.max(60, Number(session.expires_in) || 3600);
  response.cookies.set(ACCESS_COOKIE, session.access_token, {
    ...cookieBase,
    maxAge: accessAge
  });
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearAuthCookies(response) {
  response.cookies.set(ACCESS_COOKIE, "", {
    ...cookieBase,
    maxAge: 0,
    expires: new Date(0)
  });
  response.cookies.set(REFRESH_COOKIE, "", {
    ...cookieBase,
    maxAge: 0,
    expires: new Date(0)
  });
}

export async function getUserFromRequest(request) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value || "";
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value || "";
  if (!accessToken && !refreshToken) return { user: null, session: null };

  const supabase = getSupabaseAdmin();
  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error && data.user) return { user: data.user, session: null };
  }

  if (refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (!error && data.user && data.session) {
      return { user: data.user, session: data.session };
    }
  }

  return { user: null, session: null };
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email || "",
    fullName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
    phone: typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : ""
  };
}
