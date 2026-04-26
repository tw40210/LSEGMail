/**
 * Development UI: Gmail tab, rotation "Test Mail", etc.
 * Set `VITE_DEV_MODE=true` / `false` in docker-compose or `.env`.
 * If unset: follows Vite (`true` on dev server, `false` in production build).
 */
function parseDevMode(): boolean {
  const v = import.meta.env.VITE_DEV_MODE;
  if (v === "false" || v === "0") return false;
  if (v === "true" || v === "1") return true;
  return import.meta.env.DEV;
}

export const devMode = parseDevMode();
