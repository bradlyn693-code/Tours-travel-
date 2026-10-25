import "server-only";
import { createClient } from "@supabase/supabase-js";

function configError(code) {
  const error = new Error(code);
  error.status = 503;
  error.code = code;
  return error;
}

export function getSupabaseAdmin() {
  const marker = process.env.SUPABASE_ENVIRONMENT;
  let url = "";
  let serviceRoleKey = "";
  let projectRef = "";

  if (marker === "test") {
    url = process.env.SUPABASE_URL || "";
    serviceRoleKey = process.env.SERVICE_ROLE_KEY || "";
    projectRef = process.env.SUPABASE_TEST_PROJECT_REF || "";
  } else if (marker === "production") {
    if (process.env.NODE_ENV !== "production" || (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production")) {
      throw configError("production_supabase_project_required");
    }
    url = process.env.SUPABASE_PRODUCTION_URL || "";
    serviceRoleKey = process.env.SUPABASE_PRODUCTION_SERVICE_ROLE_KEY || "";
    projectRef = process.env.SUPABASE_PRODUCTION_PROJECT_REF || "";
  } else {
    throw configError("supabase_environment_required");
  }

  let urlProjectRef = "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co")) {
      urlProjectRef = parsed.hostname.slice(0, -".supabase.co".length);
    }
  } catch {
    // The generic project-configuration error intentionally hides URL details.
  }

  if (!url || !serviceRoleKey || serviceRoleKey === "placeholder" || !projectRef || !urlProjectRef || projectRef !== urlProjectRef) {
    throw configError(marker === "production" ? "production_supabase_project_required" : "test_supabase_project_required");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { "X-Client-Info": `safaribookings-${marker}-server` } }
  });
}
