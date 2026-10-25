function normalizeOrigin(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.origin;
  } catch {
    return "";
  }
}

function vercelPreviewOrigin(value) {
  if (!value || value.includes("@")) return "";
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".vercel.app") || url.port || url.pathname !== "/" || url.search || url.hash) return "";
    return url.origin;
  } catch {
    return "";
  }
}

function getVercelPreviewOrigins() {
  if (process.env.VERCEL_ENV !== "preview" && process.env.VERCEL_ENV !== "development") return [];
  return [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
    .map(vercelPreviewOrigin)
    .filter(Boolean);
}

export function getAllowedOrigins() {
  const configured = [
    process.env.ALLOWED_ORIGINS,
    process.env.PREVIEW_ORIGIN,
    process.env.APP_ALLOWED_ORIGINS
  ].filter(Boolean);

  return new Set([
    ...configured
      .flatMap((value) => value.split(","))
      .map((origin) => normalizeOrigin(origin.trim()))
      .filter(Boolean),
    ...getVercelPreviewOrigins()
  ]);
}

export function isAllowedOrigin(request) {
  const origin = normalizeOrigin(request.headers.get("origin") || "");
  return Boolean(origin) && getAllowedOrigins().has(origin);
}
